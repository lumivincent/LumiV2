import { NextRequest, NextResponse } from 'next/server';
import { cancelRequest, completeRequest, createRecord, getWorkspace, saveOutput } from '@/lib/workspace-store';
import { openAIFetch, openAITransport } from '@/lib/openai-fetch';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_MODEL = 'gpt-5.6-terra';
const MAX_SOURCE_CONTEXT = 90_000;
type AnalysisControllerStore = Map<string, AbortController>;
const globalStore = globalThis as typeof globalThis & { __lumiterraAnalysisControllers?: AnalysisControllerStore };
const analysisControllers = globalStore.__lumiterraAnalysisControllers ?? new Map<string, AbortController>();
globalStore.__lumiterraAnalysisControllers = analysisControllers;

type ResponsesResult = {
  id?: string;
  model?: string;
  status?: 'completed' | 'incomplete' | 'failed' | 'cancelled' | 'queued' | 'in_progress';
  incomplete_details?: { reason?: string };
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
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

function sourceContext(sources: Array<{ title: string; content: string }>) {
  let remaining = MAX_SOURCE_CONTEXT;
  return sources.map((source) => {
    if (remaining <= 0) return '';
    const content = source.content.slice(0, remaining);
    remaining -= content.length;
    return `【产品源文档：${source.title}】\n${content}`;
  }).filter(Boolean).join('\n\n');
}

function requestTitle(content: string) {
  return content.split('\n').find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim() || '运营分析';
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_TEXT_MODEL || DEFAULT_MODEL,
    transport: openAITransport(),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  let requestPath = '';
  let controller: AbortController | undefined;
  const forwardRequestAbort = () => controller?.abort();
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('尚未配置 OpenAI API Key');
    const body = await request.json() as { requestPath?: string };
    requestPath = String(body.requestPath ?? '').replaceAll('\\', '/');
    if (!requestPath.startsWith('records/requests/') || !requestPath.endsWith('.md')) throw new Error('分析任务路径无效');
    analysisControllers.get(requestPath)?.abort();
    controller = new AbortController();
    analysisControllers.set(requestPath, controller);
    if (request.signal.aborted) controller.abort();
    else request.signal.addEventListener('abort', forwardRequestAbort, { once: true });

    const workspace = await getWorkspace();
    const requestFile = workspace.records.find((file) => file.path === requestPath);
    if (!requestFile?.content) throw new Error('没有找到分析任务');
    const title = requestTitle(requestFile.content);
    const model = process.env.OPENAI_ANALYSIS_MODEL || process.env.OPENAI_TEXT_MODEL || DEFAULT_MODEL;
    const input = [
      `【本次分析任务】\n${requestFile.content.slice(0, 100_000)}`,
      `【当前项目记忆】\n${workspace.memory.current.slice(0, 12_000)}`,
      sourceContext(workspace.sources),
    ].filter(Boolean).join('\n\n');

    const response = await openAIFetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        store: true,
        instructions: [
          '你是 Lumiterra V2 的运营研究与产品分析助手。',
          '严格以最新产品源文档为产品事实来源；任务中提供的新增与删除内容用于界定本次变化。',
          '输出一份可以快速阅读、可追溯、能直接支持运营决策的中文 Markdown 分析。',
          '必须分别标明：已确认产品事实、运营解释或建议、仍需团队确认的假设。',
          '回答任务提出的全部问题，重点说明变化、影响、风险和需要调整的公开表达。',
          '不得把未确认日期、数值、经济结果或 Token 回报写成公开承诺。',
          '只输出分析正文，不重复文档标题，不描述你的分析过程。',
        ].join('\n'),
        input,
        reasoning: { effort: 'medium' },
        text: { verbosity: 'medium' },
        max_output_tokens: 10_000,
        prompt_cache_key: 'lumiterra-v2-analysis-v1',
      }),
    });
    const result = await response.json() as ResponsesResult;
    if (controller.signal.aborted) throw new DOMException('分析已取消', 'AbortError');
    if (!response.ok) throw new Error(result.error?.message || 'OpenAI API 分析失败');
    if (result.status === 'incomplete') {
      const reason = result.incomplete_details?.reason === 'max_output_tokens' ? '输出达到长度上限' : '模型未完成生成';
      throw new Error(`OpenAI API 分析未完整生成（${reason}），未保存不完整结果`);
    }
    const content = responseText(result);
    if (!content) throw new Error('OpenAI API 没有返回分析内容');

    const previousProvider = requestFile.content.match(/- 执行方式：([^\r\n]+)/)?.[1]?.trim();
    const previousOutput = requestFile.content.match(/- 分析产出：([^\r\n]+)/)?.[1]?.trim();
    const reusableOutputPath = previousProvider === 'OpenAI API' && previousOutput?.startsWith('outputs/documents/') && previousOutput.endsWith('.md')
      ? previousOutput
      : undefined;
    const output = await saveOutput({ category: 'documents', title, content, path: reusableOutputPath });
    const usedSources = workspace.sources.map((source) => `- sources/${source.filename}`).join('\n') || '- 无';
    const session = await createRecord({
      title: `${title} · API 执行`,
      content: [
        `- 执行方式：OpenAI API`,
        `- 模型：${result.model || model}`,
        `- 分析任务：${requestPath}`,
        `- 分析产出：${output.path}`,
        `- Token：输入 ${result.usage?.input_tokens ?? 0} / 输出 ${result.usage?.output_tokens ?? 0} / 缓存 ${result.usage?.input_tokens_details?.cached_tokens ?? 0}`,
        '',
        '## 使用资料',
        '',
        '- memory/current.md',
        usedSources,
        '',
        '## 重要判断',
        '',
        '- 以最新 sources/ 文档作为产品事实，任务中的差异用于识别本次更新影响。',
        '- 运营建议与待确认信息已在分析产出中分开，未将未确认内容写成公开承诺。',
        '',
        '## 剩余问题',
        '',
        '- 见分析产出中的“待团队确认”部分。',
      ].join('\n'),
    });
    await completeRequest({ path: requestPath, outputPath: output.path, sessionPath: session.path, provider: 'api' });

    return NextResponse.json({
      path: output.path,
      sessionPath: session.path,
      model: result.model || model,
      responseId: result.id,
      usage: {
        inputTokens: result.usage?.input_tokens ?? 0,
        outputTokens: result.usage?.output_tokens ?? 0,
        cachedTokens: result.usage?.input_tokens_details?.cached_tokens ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '分析失败' }, { status: 400 });
  } finally {
    request.signal.removeEventListener('abort', forwardRequestAbort);
    if (requestPath && controller && analysisControllers.get(requestPath) === controller) analysisControllers.delete(requestPath);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const requestPath = request.nextUrl.searchParams.get('requestPath') ?? '';
    analysisControllers.get(requestPath)?.abort();
    return NextResponse.json(await cancelRequest(requestPath));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '无法取消分析' }, { status: 400 });
  }
}
