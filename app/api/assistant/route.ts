import { NextRequest, NextResponse } from 'next/server';
import { getWorkspace } from '@/lib/workspace-store';
import { openAIFetch, openAITransport } from '@/lib/openai-fetch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MODEL = 'gpt-5.6-terra';

type ResponsesResult = {
  id?: string;
  model?: string;
  status?: 'completed' | 'incomplete' | 'failed' | 'cancelled' | 'queued' | 'in_progress';
  incomplete_details?: { reason?: string };
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } };
  error?: { message?: string };
};

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
    model: process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_TEXT_MODEL || DEFAULT_MODEL,
    transport: openAITransport(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('尚未配置 OpenAI API Key');
    const body = await request.json() as Record<string, unknown>;
    const kind = body.kind === 'analysis' ? 'analysis' : 'knowledge';
    const prompt = String(body.prompt ?? '').trim().slice(0, 40_000);
    const previousResponseId = String(body.previousResponseId ?? '').trim().slice(0, 500);
    const includeSources = body.includeSources === true;
    const knowledgePaths = Array.isArray(body.knowledgePaths) ? [...new Set(body.knowledgePaths.map(String).filter((path) => path.startsWith('knowledge/') && path.endsWith('.md')))].slice(0, 12) : [];
    const transcript = Array.isArray(body.messages) ? body.messages.slice(-12).flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const item = entry as Record<string, unknown>;
      const role = item.role === 'assistant' ? '助手' : item.role === 'user' ? '用户' : '';
      const content = String(item.content ?? '').trim().slice(0, 20_000);
      return role && content ? [`${role}：${content}`] : [];
    }).join('\n\n') : '';
    if (!prompt) throw new Error('请输入需要讨论或分析的问题');

    const workspace = await getWorkspace();
    let remainingKnowledge = 30_000;
    const knowledgeContext = knowledgePaths.map((path) => {
      if (remainingKnowledge <= 0) return '';
      const metadata = workspace.knowledgeMetadata.find((item) => item.path === path && item.status !== 'archived');
      const file = workspace.knowledgeFiles.find((item) => item.path === path);
      if (!metadata || !file?.content) return '';
      const content = file.content.slice(0, remainingKnowledge);
      remainingKnowledge -= content.length;
      return `【知识库参考 · ${metadata.title}】\n${content}`;
    }).filter(Boolean).join('\n\n');

    let remainingSources = 70_000;
    const sourceContext = includeSources ? workspace.sources.map((source) => {
      if (remainingSources <= 0) return '';
      const content = source.content.slice(0, remainingSources);
      remainingSources -= content.length;
      return `【产品事实来源 · ${source.title}】\n${content}`;
    }).filter(Boolean).join('\n\n') : '';

    const input = [
      !previousResponseId && transcript ? `【此前对话】\n${transcript}` : '',
      knowledgeContext,
      sourceContext,
      `【本轮用户输入】\n${prompt}`,
    ].filter(Boolean).join('\n\n');
    const model = process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_TEXT_MODEL || DEFAULT_MODEL;
    const instructions = kind === 'analysis' ? [
      '你是 Lumiterra V2 的运营研究与产品分析助手，以多轮对话方式帮助用户澄清问题、修正判断并形成可复用结论。',
      '标为产品事实来源的内容优先级最高；知识库是研究资料和运营判断，不能覆盖产品事实。',
      '明确区分：已确认产品事实、运营解释或建议、仍需团队确认的假设。',
      '直接回答当前问题，必要时给出结构化结论，不描述隐藏分析过程。',
      '不得把未确认日期、数值、经济结果或 Token 回报写成公开承诺。',
    ] : [
      '你是 Lumiterra V2 的运营知识协作助手，与用户进行自然、多轮的研究、讨论和脑暴。',
      '知识库内容用于提供背景和可追溯证据；若同时提供产品事实来源，后者优先级最高。',
      '将证据、运营判断和待确认假设分开；没有证据的脑暴结论必须标为假设或低置信度判断。',
      '直接回应当前问题，不自动把对话内容宣布为已确认事实，也不描述隐藏分析过程。',
    ];

    const response = await openAIFetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: request.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        store: true,
        ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
        instructions: instructions.join('\n'),
        input,
        reasoning: { effort: kind === 'analysis' ? 'medium' : 'low' },
        text: { verbosity: 'medium' },
        max_output_tokens: 6_000,
        prompt_cache_key: `lumiterra-v2-${kind}-conversation-v1`,
      }),
    });
    const result = await response.json() as ResponsesResult;
    if (!response.ok) throw new Error(result.error?.message || 'OpenAI API 对话失败');
    if (result.status === 'incomplete') throw new Error(result.incomplete_details?.reason === 'max_output_tokens' ? '回复达到长度上限，请缩小问题范围后继续' : '模型未完成回复');
    const content = responseText(result);
    if (!content) throw new Error('OpenAI API 没有返回可用内容');
    return NextResponse.json({
      content,
      responseId: result.id,
      model: result.model || model,
      usage: {
        inputTokens: result.usage?.input_tokens ?? 0,
        outputTokens: result.usage?.output_tokens ?? 0,
        cachedTokens: result.usage?.input_tokens_details?.cached_tokens ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI 对话失败' }, { status: 400 });
  }
}
