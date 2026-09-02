import { NextRequest, NextResponse } from 'next/server';
import { getWorkspace } from '@/lib/workspace-store';
import { openAIFetch, openAITransport } from '@/lib/openai-fetch';
import { codexExecutionAvailable } from '@/lib/runtime-capabilities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MODEL = 'gpt-5.6-sol';
const MAX_SOURCE_CONTEXT = 8_000;

type ContentMode = 'explore' | 'refine' | 'fact_check';
type ContentCandidate = { id: string; label: string; angle: string; content: string };
type FactCheckResult = {
  status: 'pass' | 'needs_changes';
  summary: string;
  issues: Array<{ severity: 'high' | 'medium' | 'low'; issue: string; basis: string }>;
  correctedContent: string;
};

type ResponsesResult = {
  id?: string;
  model?: string;
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
  error?: { message?: string };
};

function searchTerms(value: string) {
  const normalized = value.toLowerCase();
  const english = normalized.match(/[a-z0-9]{3,}/g) ?? [];
  const chinese = normalized.replace(/[^\u4e00-\u9fff]/g, '');
  const chinesePairs = Array.from({ length: Math.max(0, chinese.length - 1) }, (_, index) => chinese.slice(index, index + 2));
  return [...new Set([...english, ...chinesePairs])].slice(0, 80);
}

function sourceContext(sources: Array<{ title: string; content: string }>, query: string) {
  const terms = searchTerms(query);
  const sections = sources.flatMap((source) => source.content
    .split(/(?=^#{1,4}\s+)/m)
    .map((content, index) => ({
      source: source.title,
      content: content.trim(),
      index,
      score: terms.reduce((score, term) => score + (content.toLowerCase().includes(term) ? 1 : 0), 0),
    }))
    .filter((section) => section.content));
  const ranked = sections.sort((a, b) => b.score - a.score || a.index - b.index);
  const selected = (ranked.some((section) => section.score > 0) ? ranked.filter((section) => section.score > 0) : ranked).slice(0, 6);
  let remaining = MAX_SOURCE_CONTEXT;
  return selected.map((section) => {
    if (remaining <= 0) return '';
    const content = section.content.slice(0, remaining);
    remaining -= content.length;
    return `【${section.source}】\n${content}`;
  }).filter(Boolean).join('\n\n');
}

function responseText(result: ResponsesResult) {
  if (result.output_text?.trim()) return result.output_text.trim();
  return result.output?.flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text' && item.text)
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join('\n\n') ?? '';
}

function structuredJson<T>(value: string): T {
  const normalized = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(normalized) as T;
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    codexAvailable: codexExecutionAvailable(),
    model: process.env.OPENAI_TEXT_MODEL || DEFAULT_MODEL,
    transport: openAITransport(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('尚未配置 OpenAI API Key');
    const body = await request.json() as Record<string, unknown>;
    const mode: ContentMode = body.mode === 'explore' || body.mode === 'fact_check' ? body.mode : 'refine';
    const action = String(body.action ?? (mode === 'explore' ? '探索三个创意方向' : mode === 'fact_check' ? '定稿前事实检查' : '继续精修当前版本')).trim().slice(0, 500);
    const instruction = String(body.instruction ?? '').trim().slice(0, 20_000);
    const temporaryContext = String(body.temporaryContext ?? '').trim().slice(0, 30_000);
    const draft = String(body.draft ?? '').trim().slice(0, 60_000);
    const previousResponseId = String(body.previousResponseId ?? '').trim().slice(0, 500);
    const conversationSummary = String(body.conversationSummary ?? '').trim().slice(-6_000);
    const format = String(body.format ?? 'post').slice(0, 30);
    const language = String(body.language ?? 'en').slice(0, 30);
    const relatedPaths = Array.isArray(body.relatedPaths) ? body.relatedPaths.map(String).slice(0, 4) : [];
    const knowledgePaths = Array.isArray(body.knowledgePaths) ? [...new Set(body.knowledgePaths.map(String).filter((path) => path.startsWith('knowledge/') && path.endsWith('.md')))].slice(0, 12) : [];
    if (!instruction && !draft) throw new Error('请先填写内容需求或草稿');

    const workspace = await getWorkspace();
    const query = `${action}\n${instruction}\n${temporaryContext}\n${draft}`;
    const approvedPaths = new Set(workspace.contentMetadata
      .filter((item) => (item.status === 'final' || item.status === 'published') && !item.reviewRequired)
      .map((item) => item.path));
    const approvedContent = relatedPaths
      .filter((path) => approvedPaths.has(path))
      .flatMap((path) => {
        const file = workspace.outputs.find((item) => item.path === path);
        return file?.content ? [`【已定稿表达 · ${file.path}】\n${file.content.slice(0, 2_000)}`] : [];
      })
      .join('\n\n');
    const relevantSources = sourceContext(workspace.sources, query);
    let remainingKnowledge = 8_000;
    const selectedKnowledge = knowledgePaths.map((path) => {
      if (remainingKnowledge <= 0) return '';
      const metadata = workspace.knowledgeMetadata.find((item) => item.path === path && item.status !== 'archived');
      const file = workspace.knowledgeFiles.find((item) => item.path === path);
      if (!metadata || !file?.content) return '';
      const content = file.content.slice(0, remainingKnowledge);
      remainingKnowledge -= content.length;
      return `【知识库参考 · ${metadata.title}】\n${content}`;
    }).filter(Boolean).join('\n\n');
    const model = process.env.OPENAI_TEXT_MODEL || DEFAULT_MODEL;

    const input = [
      `本次操作：${action}`,
      `内容形式：${format}`,
      `输出语言：${language}`,
      `当前 Marketing 内容需求：\n${instruction || '基于当前草稿继续处理'}`,
      temporaryContext ? `本次临时背景、热点或链接：\n${temporaryContext}` : '',
      draft ? `当前草稿：\n${draft}` : '',
      conversationSummary ? `前序创作会话中已经确认的要求：\n${conversationSummary}` : '',
      `当前项目记忆：\n${workspace.memory.current.slice(0, 3_500)}`,
      `与本次任务相关的最新产品原文：\n${relevantSources || '暂无可用片段'}`,
      selectedKnowledge ? `用户明确选择的知识库参考：\n${selectedKnowledge}` : '',
      approvedContent ? `相关的已定稿或已发布表达：\n${approvedContent}` : '当前没有匹配的已定稿表达。',
    ].filter(Boolean).join('\n\n');

    const modeInstruction = mode === 'explore'
      ? [
        '这是方向探索，不是润色。生成恰好三个核心判断、情绪触发和开头 Hook 都明显不同的方向；不得只做近义改写。',
        '每个方向包含简短名称、为什么值得选的角度说明，以及一份可直接发布的完整正文。',
        '正文应让人感到这是 Lumiterra 独有的表达，避免 Monad knows、something is coming 等通用 Crypto 占位口号。',
      ].join('\n')
      : mode === 'fact_check'
      ? [
        '这是定稿前检查，不要静默覆盖用户正文。逐项核对当前草稿与最新产品原文。',
        '说明是否可以发布、具体风险及对应依据，并提供一份只修正事实风险、不随意改变创意方向的修正版。',
      ].join('\n')
      : [
        '这是已选方向上的单线精修。只输出一个完整新版。',
        '严格执行本次操作；除非用户明确要求，不改变核心观点、叙事方向、已确认事实和有效表达。',
        '把前序反馈理解为取舍：保留用户认可的部分，避免再次引入已经拒绝的表达。',
      ].join('\n');
    const text = mode === 'explore' ? {
      verbosity: 'low',
      format: {
        type: 'json_schema',
        name: 'lumiterra_content_directions',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            candidates: {
              type: 'array', minItems: 3, maxItems: 3,
              items: {
                type: 'object', additionalProperties: false,
                properties: { label: { type: 'string' }, angle: { type: 'string' }, content: { type: 'string' } },
                required: ['label', 'angle', 'content'],
              },
            },
          },
          required: ['candidates'], additionalProperties: false,
        },
      },
    } : mode === 'fact_check' ? {
      verbosity: 'low',
      format: {
        type: 'json_schema',
        name: 'lumiterra_content_fact_check',
        strict: true,
        schema: {
          type: 'object', additionalProperties: false,
          properties: {
            status: { type: 'string', enum: ['pass', 'needs_changes'] },
            summary: { type: 'string' },
            issues: {
              type: 'array',
              items: {
                type: 'object', additionalProperties: false,
                properties: {
                  severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                  issue: { type: 'string' },
                  basis: { type: 'string' },
                },
                required: ['severity', 'issue', 'basis'],
              },
            },
            correctedContent: { type: 'string' },
          },
          required: ['status', 'summary', 'issues', 'correctedContent'],
        },
      },
    } : { verbosity: 'low' };

    const response = await openAIFetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        store: true,
        ...(mode === 'refine' && previousResponseId ? { previous_response_id: previousResponseId } : {}),
        instructions: [
          '你是 Lumiterra V2 的 Crypto/Web3 运营内容编辑。',
          '最新产品原文是事实来源；项目记忆和定稿内容只用于运营边界与表达风格。',
          '知识库内容是研究资料和运营判断，只能作为参考，不能覆盖或替代最新产品原文。',
          '区分已确认事实、运营表达和待确认信息；不得承诺未经确认的日期、数值、Token 收益或结果。',
          '保持自然、具体、Crypto Native，避免空泛宣传语和明显 AI 腔。',
          modeInstruction,
        ].join('\n'),
        input,
        reasoning: { effort: 'low' },
        text,
        max_output_tokens: 3_000,
        prompt_cache_key: 'lumiterra-v2-content-v1',
      }),
    });
    const result = await response.json() as ResponsesResult;
    if (!response.ok) throw new Error(result.error?.message || 'OpenAI API 内容生成失败');
    const content = responseText(result);
    if (!content) throw new Error('OpenAI API 没有返回可用内容');
    let candidates: ContentCandidate[] | undefined;
    let factCheck: FactCheckResult | undefined;
    if (mode === 'explore') {
      const parsed = structuredJson<{ candidates?: Array<{ label?: string; angle?: string; content?: string }> }>(content);
      candidates = (parsed.candidates ?? []).slice(0, 3).map((candidate, index) => ({
        id: String.fromCharCode(65 + index),
        label: String(candidate.label ?? `方向 ${index + 1}`).trim().slice(0, 80),
        angle: String(candidate.angle ?? '').trim().slice(0, 500),
        content: String(candidate.content ?? '').trim().slice(0, 20_000),
      })).filter((candidate) => candidate.content);
      if (candidates.length !== 3) throw new Error('模型没有返回三个完整方向，请重试');
    } else if (mode === 'fact_check') {
      const parsed = structuredJson<FactCheckResult>(content);
      factCheck = {
        status: parsed.status === 'pass' ? 'pass' : 'needs_changes',
        summary: String(parsed.summary ?? '').trim().slice(0, 2_000),
        issues: (Array.isArray(parsed.issues) ? parsed.issues : []).slice(0, 12).map((issue) => ({
          severity: issue.severity === 'high' || issue.severity === 'medium' ? issue.severity : 'low',
          issue: String(issue.issue ?? '').trim().slice(0, 1_000),
          basis: String(issue.basis ?? '').trim().slice(0, 2_000),
        })),
        correctedContent: String(parsed.correctedContent ?? '').trim().slice(0, 60_000),
      };
    }
    return NextResponse.json({
      content: mode === 'refine' ? content : undefined,
      candidates,
      factCheck,
      model: result.model || model,
      responseId: result.id,
      usage: {
        inputTokens: result.usage?.input_tokens ?? 0,
        outputTokens: result.usage?.output_tokens ?? 0,
        cachedTokens: result.usage?.input_tokens_details?.cached_tokens ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '内容生成失败' }, { status: 400 });
  }
}
