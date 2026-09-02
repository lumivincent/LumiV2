import { NextRequest, NextResponse } from 'next/server';
import { getWorkspace } from '@/lib/workspace-store';
import { openAIFetch, openAITransport } from '@/lib/openai-fetch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MODEL = 'gpt-5.6-terra';
const MAX_SOURCE_CONTEXT = 16_000;

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

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_TEXT_MODEL || DEFAULT_MODEL,
    transport: openAITransport(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('尚未配置 OpenAI API Key');
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? '生成一个最推荐版本').trim().slice(0, 500);
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
        return file?.content ? [`【已定稿表达 · ${file.path}】\n${file.content.slice(0, 4_000)}`] : [];
      })
      .join('\n\n');
    const relevantSources = sourceContext(workspace.sources, query);
    let remainingKnowledge = 18_000;
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
      `当前项目记忆：\n${workspace.memory.current.slice(0, 8_000)}`,
      `与本次任务相关的最新产品原文：\n${relevantSources || '暂无可用片段'}`,
      selectedKnowledge ? `用户明确选择的知识库参考：\n${selectedKnowledge}` : '',
      approvedContent ? `相关的已定稿或已发布表达：\n${approvedContent}` : '当前没有匹配的已定稿表达。',
    ].filter(Boolean).join('\n\n');

    const response = await openAIFetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        store: true,
        ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
        instructions: [
          '你是 Lumiterra V2 的 Crypto/Web3 运营内容编辑。',
          '最新产品原文是事实来源；项目记忆和定稿内容只用于运营边界与表达风格。',
          '知识库内容是研究资料和运营判断，只能作为参考，不能覆盖或替代最新产品原文。',
          '区分已确认事实、运营表达和待确认信息；不得承诺未经确认的日期、数值、Token 收益或结果。',
          '只输出一个可直接继续编辑和发布的推荐版本。不要输出内容标题、方案解释、分析过程或多个方向。',
          '保持自然、具体、Crypto Native，避免空泛宣传语和明显 AI 腔。',
        ].join('\n'),
        input,
        reasoning: { effort: 'low' },
        text: { verbosity: 'low' },
        max_output_tokens: 3_000,
        prompt_cache_key: 'lumiterra-v2-content-v1',
      }),
    });
    const result = await response.json() as ResponsesResult;
    if (!response.ok) throw new Error(result.error?.message || 'OpenAI API 内容生成失败');
    const content = responseText(result);
    if (!content) throw new Error('OpenAI API 没有返回可用内容');
    return NextResponse.json({
      content,
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
