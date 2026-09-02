import { NextRequest, NextResponse } from 'next/server';
import { createKnowledgeItem, createRecord, createRequest, deleteMarketingItem, getWorkspace, recordKnowledgeUsage, registerGeneratedAsset, saveAssistantSession, saveContent, saveMarketingItem, saveMemory, saveOutput, setAssetReference, syncSources, updateAssetMetadata, updateContentStatus, updateKnowledgeStatus, uploadAsset, type AssistantMessage, type CreationTurn, type KnowledgeItemType, type KnowledgeStatus } from '@/lib/workspace-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function assistantMessages(value: unknown): AssistantMessage[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.slice(-30).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    const role = item.role === 'assistant' ? 'assistant' : item.role === 'user' ? 'user' : undefined;
    const content = String(item.content ?? '').trim().slice(0, 80_000);
    if (!role || !content) return [];
    return [{ id: String(item.id ?? crypto.randomUUID()).slice(0, 120), role, content, createdAt: String(item.createdAt ?? new Date().toISOString()).slice(0, 80) }];
  });
}

export async function GET() {
  try {
    return NextResponse.json(await getWorkspace(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '读取工作区失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.action === 'saveMemory') {
      const key = body.key;
      if (key !== 'current' && key !== 'openQuestions' && key !== 'changelog') throw new Error('未知记忆文件');
      return NextResponse.json({ path: await saveMemory(key, String(body.content ?? '')) });
    }
    if (body.action === 'createRequest') {
      const kind = body.kind === 'analysis' ? 'analysis' : 'creation';
      const outputType = body.outputType === 'twitter' || body.outputType === 'assets' ? body.outputType : 'documents';
      return NextResponse.json(await createRequest({ kind, outputType, title: String(body.title ?? ''), brief: String(body.brief ?? '') }));
    }
    if (body.action === 'createRecord') {
      return NextResponse.json(await createRecord({ title: String(body.title ?? ''), content: String(body.content ?? '') }));
    }
    if (body.action === 'createKnowledgeItem') {
      const types: KnowledgeItemType[] = ['source', 'discussion', 'insight', 'topic', 'experiment', 'context'];
      const type = types.includes(body.type as KnowledgeItemType) ? body.type as KnowledgeItemType : 'source';
      const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];
      const topicIds = Array.isArray(body.topicIds) ? body.topicIds.map(String) : [];
      const relatedIds = Array.isArray(body.relatedIds) ? body.relatedIds.map(String) : [];
      return NextResponse.json(await createKnowledgeItem({ type, title: body.title ? String(body.title) : undefined, content: String(body.content ?? ''), reason: body.reason ? String(body.reason) : undefined, tags, topicIds, relatedIds }));
    }
    if (body.action === 'saveAssistantSession') {
      const kind = body.kind === 'analysis' ? 'analysis' : 'knowledge';
      const provider = body.provider === 'api' ? 'api' : 'codex';
      const lastProvider = body.lastProvider === 'api' ? 'api' : body.lastProvider === 'codex' ? 'codex' : undefined;
      const status = body.status === 'completed' ? 'completed' : 'active';
      return NextResponse.json(await saveAssistantSession({
        id: body.id ? String(body.id) : undefined,
        kind,
        title: body.title ? String(body.title) : undefined,
        provider,
        lastProvider,
        status,
        messages: assistantMessages(body.messages),
        knowledgePaths: Array.isArray(body.knowledgePaths) ? body.knowledgePaths.map(String) : [],
        includeSources: typeof body.includeSources === 'boolean' ? body.includeSources : undefined,
        apiResponseId: body.apiResponseId ? String(body.apiResponseId) : undefined,
        codexThreadId: body.codexThreadId ? String(body.codexThreadId) : undefined,
        outputPath: body.outputPath ? String(body.outputPath) : undefined,
      }));
    }
    if (body.action === 'recordKnowledgeUsage') {
      return NextResponse.json(await recordKnowledgeUsage({ knowledgePaths: Array.isArray(body.knowledgePaths) ? body.knowledgePaths.map(String) : [], targetPath: body.targetPath ? String(body.targetPath) : undefined }) ?? {});
    }
    if (body.action === 'saveMarketingItem') {
      const kind = body.kind === 'todo' ? 'todo' : 'timeline';
      return NextResponse.json(await saveMarketingItem({
        kind,
        id: body.id ? String(body.id) : undefined,
        title: String(body.title ?? ''),
        startDate: body.startDate ? String(body.startDate) : undefined,
        endDate: body.endDate ? String(body.endDate) : undefined,
        dueDate: body.dueDate ? String(body.dueDate) : undefined,
        status: body.status ? String(body.status) : undefined,
        notes: body.notes ? String(body.notes) : undefined,
        tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
        timelineId: body.timelineId ? String(body.timelineId) : undefined,
        contentPaths: Array.isArray(body.contentPaths) ? body.contentPaths.map(String) : [],
        assetPaths: Array.isArray(body.assetPaths) ? body.assetPaths.map(String) : [],
      }));
    }
    if (body.action === 'deleteMarketingItem') {
      return NextResponse.json(await deleteMarketingItem(body.kind === 'todo' ? 'todo' : 'timeline', String(body.id ?? '')));
    }
    if (body.action === 'updateKnowledgeStatus') {
      const statuses: KnowledgeStatus[] = ['inbox', 'processed', 'recorded', 'active', 'draft', 'reviewed', 'adopted', 'rejected', 'superseded', 'proposed', 'running', 'completed', 'stopped', 'archived'];
      if (!statuses.includes(body.status as KnowledgeStatus)) throw new Error('未知知识状态');
      return NextResponse.json(await updateKnowledgeStatus(String(body.path ?? ''), body.status as KnowledgeStatus));
    }
    if (body.action === 'saveOutput') {
      const category = body.category === 'twitter' || body.category === 'assets' ? body.category : 'documents';
      return NextResponse.json(await saveOutput({ category, title: String(body.title ?? ''), content: String(body.content ?? ''), path: body.path ? String(body.path) : undefined }));
    }
    if (body.action === 'saveContent') {
      const formats = ['post', 'thread', 'reply', 'quote', 'other'] as const;
      const languages = ['en', 'zh', 'bilingual'] as const;
      const statuses = ['draft', 'final', 'published'] as const;
      const format = formats.includes(body.format as typeof formats[number]) ? body.format as typeof formats[number] : 'post';
      const language = languages.includes(body.language as typeof languages[number]) ? body.language as typeof languages[number] : 'en';
      const status = statuses.includes(body.status as typeof statuses[number]) ? body.status as typeof statuses[number] : 'draft';
      const apiUsage = body.apiUsage && typeof body.apiUsage === 'object' ? body.apiUsage as Record<string, unknown> : undefined;
      return NextResponse.json(await saveContent({
        path: body.path ? String(body.path) : undefined,
        content: String(body.content ?? ''),
        instruction: body.instruction ? String(body.instruction) : undefined,
        temporaryContext: body.temporaryContext ? String(body.temporaryContext) : undefined,
        creativeDirection: body.creativeDirection ? String(body.creativeDirection) : undefined,
        format,
        language,
        status,
        generator: body.generator === 'api' ? 'api' : body.generator === 'codex' ? 'codex' : undefined,
        model: body.model ? String(body.model) : undefined,
        apiUsage: apiUsage ? {
          inputTokens: Number(apiUsage.inputTokens ?? 0),
          outputTokens: Number(apiUsage.outputTokens ?? 0),
          cachedTokens: Number(apiUsage.cachedTokens ?? 0),
        } : undefined,
        apiResponseId: body.apiResponseId ? String(body.apiResponseId) : undefined,
        codexThreadId: body.codexThreadId ? String(body.codexThreadId) : undefined,
        conversationTurns: creationTurns(body.conversationTurns),
        conversationSummary: body.conversationSummary ? String(body.conversationSummary) : undefined,
        knowledgePaths: Array.isArray(body.knowledgePaths) ? body.knowledgePaths.map(String) : [],
        versionAction: body.versionAction ? String(body.versionAction) : undefined,
      }));
    }
    if (body.action === 'updateContentStatus') {
      const status = body.status === 'final' || body.status === 'published' ? body.status : 'draft';
      return NextResponse.json(await updateContentStatus(String(body.path ?? ''), status));
    }
    if (body.action === 'uploadAsset') {
      return NextResponse.json(await uploadAsset({ title: String(body.title ?? ''), mimeType: String(body.mimeType ?? ''), data: String(body.data ?? '') }));
    }
    if (body.action === 'setAssetReference') {
      return NextResponse.json(await setAssetReference(String(body.path ?? ''), Boolean(body.visualReference)));
    }
    if (body.action === 'registerGeneratedAsset') {
      return NextResponse.json(await registerGeneratedAsset({
        path: String(body.path ?? ''),
        title: String(body.title ?? ''),
        usage: body.usage ? String(body.usage) : undefined,
        prompt: body.prompt ? String(body.prompt) : undefined,
        references: Array.isArray(body.references) ? body.references.map(String) : [],
        parentPath: body.parentPath ? String(body.parentPath) : undefined,
        generator: body.generator === 'api' ? 'api' : 'codex',
        briefPath: body.briefPath ? String(body.briefPath) : undefined,
        sessionPath: body.sessionPath ? String(body.sessionPath) : undefined,
        creationSource: body.creationSource === 'content' || body.creationSource === 'series' ? body.creationSource : 'independent',
        linkedContentPaths: Array.isArray(body.linkedContentPaths) ? body.linkedContentPaths.map(String) : [],
        seriesName: body.seriesName ? String(body.seriesName) : undefined,
        seriesRules: body.seriesRules ? String(body.seriesRules) : undefined,
        threadId: body.threadId ? String(body.threadId) : undefined,
        apiResponseId: body.apiResponseId ? String(body.apiResponseId) : undefined,
        conversationTurns: creationTurns(body.conversationTurns),
        conversationSummary: body.conversationSummary ? String(body.conversationSummary) : undefined,
        knowledgePaths: Array.isArray(body.knowledgePaths) ? body.knowledgePaths.map(String) : [],
      }));
    }
    if (body.action === 'updateAssetMetadata') {
      const allowedRoles = ['未分类', '角色', '场景', 'Gameplay', 'Logo', '风格', 'UI'];
      const role = allowedRoles.includes(String(body.role ?? '')) ? String(body.role) as '未分类' | '角色' | '场景' | 'Gameplay' | 'Logo' | '风格' | 'UI' : undefined;
      const status = body.status === 'adopted' || body.status === 'draft' ? body.status : undefined;
      return NextResponse.json(await updateAssetMetadata({ path: String(body.path ?? ''), title: body.title ? String(body.title) : undefined, role, status, visualReference: typeof body.visualReference === 'boolean' ? body.visualReference : undefined, defaultReference: typeof body.defaultReference === 'boolean' ? body.defaultReference : undefined }));
    }
    if (body.action === 'syncSources') {
      const documents = body.documents && typeof body.documents === 'object' ? body.documents as Record<string, string> : {};
      return NextResponse.json(await syncSources(documents));
    }
    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '操作失败' }, { status: 400 });
  }
}
