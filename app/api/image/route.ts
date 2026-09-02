import { NextRequest, NextResponse } from 'next/server';
import { getWorkspace, readAsset, saveGeneratedAsset, type CreationTurn } from '@/lib/workspace-store';
import { openAIFetch, openAITransport } from '@/lib/openai-fetch';
import { codexExecutionAvailable } from '@/lib/runtime-capabilities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SIZE_BY_RATIO: Record<string, string> = {
  '1:1': '1024x1024',
  '16:9': '1536x1024',
  '4:5': '1024x1536',
  '9:16': '1024x1536',
};

type ImageResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string; code?: string; type?: string };
};

type ImageConversationResponse = {
  id?: string;
  output?: Array<{ type?: string; result?: string }>;
  error?: { message?: string; code?: string; type?: string };
};

class ImageRequestError extends Error {
  constructor(message: string, readonly code?: string, readonly requestId?: string, readonly status?: number) {
    super(message);
    this.name = 'ImageRequestError';
  }
}

function creationTurns(value: unknown): CreationTurn[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.slice(-8).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    const provider = item.provider === 'api' ? 'api' : item.provider === 'codex' ? 'codex' : undefined;
    const instruction = String(item.instruction ?? '').trim().slice(0, 2_000);
    if (!provider || !instruction) return [];
    return [{ id: String(item.id ?? '').slice(0, 120) || crypto.randomUUID(), instruction, provider, createdAt: String(item.createdAt ?? '').slice(0, 80) || new Date().toISOString() }];
  });
}

async function imageDataFromResponse(result: ImageResponse) {
  const image = result.data?.[0];
  if (image?.b64_json) return image.b64_json;
  if (image?.url) {
    const response = await openAIFetch(image.url);
    if (!response.ok) throw new Error('无法读取生成结果');
    return Buffer.from(await response.arrayBuffer()).toString('base64');
  }
  throw new Error(result.error?.message || '图片模型没有返回图片');
}

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.OPENAI_API_KEY), codexAvailable: codexExecutionAvailable(), model: 'gpt-image-2', conversationModel: process.env.OPENAI_IMAGE_CONVERSATION_MODEL || 'gpt-5.6', transport: openAITransport() });
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('尚未配置 OpenAI API Key');

    const body = await request.json() as Record<string, unknown>;
    const title = String(body.title ?? '').trim().slice(0, 120);
    const prompt = String(body.prompt ?? '').trim().slice(0, 20_000);
    const usage = String(body.usage ?? '').trim().slice(0, 200);
    const ratio = String(body.ratio ?? '1:1');
    const quality = ['low', 'medium', 'high'].includes(String(body.quality)) ? String(body.quality) : 'medium';
    const references = Array.isArray(body.references) ? [...new Set(body.references.map(String).filter(Boolean))] : [];
    const parentPath = String(body.parentPath ?? '').trim();
    const creationSource = body.creationSource === 'edit' || body.creationSource === 'content' || body.creationSource === 'series' ? body.creationSource : 'independent';
    const linkedContentPaths = Array.isArray(body.linkedContentPaths) ? body.linkedContentPaths.map(String) : [];
    const seriesName = String(body.seriesName ?? '').trim().slice(0, 120);
    const seriesRules = String(body.seriesRules ?? '').trim().slice(0, 20_000);
    const threadId = String(body.threadId ?? '').trim().slice(0, 500);
    const conversationMode = body.conversationMode === true;
    const previousResponseId = String(body.previousResponseId ?? '').trim().slice(0, 500);
    const conversationSummary = String(body.conversationSummary ?? '').trim().slice(-6_000);
    const conversationTurns = creationTurns(body.conversationTurns);
    const knowledgePaths = Array.isArray(body.knowledgePaths) ? [...new Set(body.knowledgePaths.map(String).filter((path) => path.startsWith('knowledge/') && path.endsWith('.md')))].slice(0, 12) : [];
    if (!title || !prompt) throw new Error('请填写素材名称和画面目标');

    const workspace = knowledgePaths.length ? await getWorkspace() : undefined;
    let remainingKnowledge = 18_000;
    const knowledgeContext = knowledgePaths.map((path) => {
      if (remainingKnowledge <= 0) return '';
      const metadata = workspace?.knowledgeMetadata.find((item) => item.path === path && item.status !== 'archived');
      const file = workspace?.knowledgeFiles.find((item) => item.path === path);
      if (!metadata || !file?.content) return '';
      const content = file.content.slice(0, remainingKnowledge);
      remainingKnowledge -= content.length;
      return `【知识库参考：${metadata.title}】\n${content}`;
    }).filter(Boolean).join('\n\n');
    const modelPrompt = `${prompt}${knowledgeContext ? `\n\n以下知识库内容只用于叙事、背景与画面方向，不替代产品事实或视觉参考：\n${knowledgeContext}` : ''}`;

    const size = SIZE_BY_RATIO[ratio] ?? SIZE_BY_RATIO['1:1'];
    if (conversationMode) {
      const imagePaths = [...new Set([parentPath, ...references].filter(Boolean))];
      const content: Array<{ type: 'input_text'; text: string } | { type: 'input_image'; image_url: string }> = [{
        type: 'input_text',
        text: `${modelPrompt}${conversationSummary ? `\n\n前序创作已经确认的要求：\n${conversationSummary}` : ''}`,
      }];
      if (!previousResponseId) {
        for (let index = 0; index < imagePaths.length; index += 1) {
          const path = imagePaths[index];
          const asset = await readAsset(path);
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType)) continue;
          content.push({ type: 'input_text', text: index === 0 && path === parentPath ? `图像 ${index + 1}：这是唯一需要修改的主图（${path}）。` : `图像 ${index + 1}：这是参考图片（${path}），只用于用户指定的参考作用。` });
          content.push({ type: 'input_image', image_url: `data:${asset.mimeType};base64,${asset.data.toString('base64')}` });
        }
      }
      const response = await openAIFetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_IMAGE_CONVERSATION_MODEL || 'gpt-5.6',
          store: true,
          ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
          input: [{ role: 'user', content }],
          tools: [{ type: 'image_generation', model: 'gpt-image-2', action: imagePaths.length || previousResponseId ? 'edit' : 'generate', size, quality, output_format: 'png' }],
          tool_choice: { type: 'image_generation' },
        }),
      });
      const result = await response.json() as ImageConversationResponse;
      if (!response.ok) throw new ImageRequestError(result.error?.message || '多轮图片生成失败', result.error?.code, response.headers.get('x-request-id') ?? undefined, response.status);
      const data = result.output?.find((item) => item.type === 'image_generation_call')?.result;
      if (!data) throw new Error('图片会话没有返回新图片');
      const saved = await saveGeneratedAsset({ title, data, usage, prompt, references, parentPath: parentPath || undefined, creationSource, linkedContentPaths, seriesName: seriesName || undefined, seriesRules: seriesRules || undefined, threadId: threadId || undefined, apiResponseId: result.id, conversationTurns, conversationSummary, knowledgePaths });
      return NextResponse.json({ ...saved, model: 'gpt-image-2', conversationModel: process.env.OPENAI_IMAGE_CONVERSATION_MODEL || 'gpt-5.6', responseId: result.id });
    }

    let response: Response;
    if (references.length) {
      const form = new FormData();
      form.set('model', 'gpt-image-2');
      form.set('prompt', `${modelPrompt}\n\n附件顺序：${references.map((path, index) => `图像 ${index + 1}=${path}`).join('；')}。请严格按此顺序和提示词中的 @编号对应关系使用参考图。`);
      form.set('size', size);
      form.set('quality', quality);
      form.set('output_format', 'png');
      form.set('n', '1');
      for (let index = 0; index < references.length; index += 1) {
        const asset = await readAsset(references[index]);
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType)) throw new Error('参考素材仅支持 PNG、JPG 和 WebP');
        form.append('image[]', new Blob([new Uint8Array(asset.data)], { type: asset.mimeType }), `reference-${index}.${asset.mimeType.split('/')[1]}`);
      }
      response = await openAIFetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form });
    } else {
      response = await openAIFetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-image-2', prompt: modelPrompt, size, quality, output_format: 'png', n: 1 }),
      });
    }

    const result = await response.json() as ImageResponse;
    if (!response.ok) throw new ImageRequestError(result.error?.message || '图片生成失败', result.error?.code, response.headers.get('x-request-id') ?? undefined, response.status);
    const data = await imageDataFromResponse(result);
    const saved = await saveGeneratedAsset({ title, data, usage, prompt, references, parentPath: parentPath || undefined, creationSource, linkedContentPaths, seriesName: seriesName || undefined, seriesRules: seriesRules || undefined, threadId: threadId || undefined, conversationTurns, conversationSummary, knowledgePaths });
    return NextResponse.json({ ...saved, model: 'gpt-image-2' });
  } catch (error) {
    const requestError = error instanceof ImageRequestError ? error : undefined;
    const message = error instanceof Error ? error.message : '图片生成失败';
    console.warn('Image generation failed', { message, code: requestError?.code, requestId: requestError?.requestId, status: requestError?.status });
    return NextResponse.json({ error: message, code: requestError?.code, requestId: requestError?.requestId, upstreamStatus: requestError?.status }, { status: 400 });
  }
}
