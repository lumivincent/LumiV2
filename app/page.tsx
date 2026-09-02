'use client';

import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

type View = 'dashboard' | 'documents' | 'marketing' | 'content' | 'assets' | 'knowledge';
type MemoryKey = 'current' | 'openQuestions' | 'changelog';
type OutputCategory = 'documents' | 'twitter' | 'assets';
type Notice = { tone: 'success' | 'error'; text: string } | null;
type Source = { id: string; title: string; filename: string; url: string; content: string; updatedAt: string; hash: string };
type WorkFile = { path: string; name: string; kind: string; updatedAt: string; size: number; content?: string };
type SourceSnapshot = WorkFile & { sourceId: string };
type SourceChange = { id: string; title: string; changed: boolean; added: number; removed: number; addedLines: string[]; removedLines: string[] };
type AssetRole = '未分类' | '角色' | '场景' | 'Gameplay' | 'Logo' | '风格' | 'UI';
type AssetCreationSource = 'independent' | 'content' | 'series';
type ExecutionMode = 'codex' | 'api';
type CreationTurn = { id: string; instruction: string; provider: ExecutionMode; createdAt: string };
type ImageGenerationFailure = { message: string; code?: string; requestId?: string; failedAt: string };
type AssetMetadata = { path: string; title: string; source: 'upload' | 'generated'; createdAt: string; generator?: 'codex' | 'api'; status?: 'draft' | 'adopted'; role?: AssetRole; usage?: string; prompt?: string; references?: string[]; parentPath?: string; visualReference?: boolean; defaultReference?: boolean; groupId?: string; version?: number; briefPath?: string; sessionPath?: string; creationSource?: AssetCreationSource; linkedContentPaths?: string[]; seriesName?: string; seriesRules?: string; threadId?: string; apiResponseId?: string; conversationTurns?: CreationTurn[]; conversationSummary?: string; knowledgePaths?: string[] };
type ContentFormat = 'post' | 'thread' | 'reply' | 'quote' | 'other';
type ContentLanguage = 'en' | 'zh' | 'bilingual';
type ContentStatus = 'draft' | 'final' | 'published';
type ApiUsage = { inputTokens: number; outputTokens: number; cachedTokens: number };
type ContentVersion = { id: string; content: string; createdAt: string; action: string; generator?: ExecutionMode; model?: string; apiUsage?: ApiUsage };
type ContentCandidate = { id: string; label: string; angle: string; content: string };
type DirectionRun = { candidates: ContentCandidate[]; provider: ExecutionMode; createdAt: string; model?: string; responseId?: string; threadId?: string; usage?: ApiUsage; turns: CreationTurn[]; summary: string };
type FactCheckResult = { status: 'pass' | 'needs_changes'; summary: string; issues: Array<{ severity: 'high' | 'medium' | 'low'; issue: string; basis: string }>; correctedContent: string };
type ContentRunMode = 'explore' | 'refine' | 'fact_check';
type ContentMetadata = { path: string; status: ContentStatus; format: ContentFormat; language: ContentLanguage; instruction?: string; temporaryContext?: string; creativeDirection?: string; createdAt: string; updatedAt: string; finalizedAt?: string; publishedAt?: string; sourceHashes?: Record<string, string>; reviewRequired?: boolean; generator?: ExecutionMode; model?: string; apiUsage?: ApiUsage; apiResponseId?: string; codexThreadId?: string; conversationTurns?: CreationTurn[]; conversationSummary?: string; knowledgePaths?: string[]; versions?: ContentVersion[] };
type KnowledgeItemType = 'source' | 'discussion' | 'insight' | 'topic' | 'experiment' | 'context';
type KnowledgeStatus = 'inbox' | 'processed' | 'recorded' | 'active' | 'draft' | 'reviewed' | 'adopted' | 'rejected' | 'superseded' | 'proposed' | 'running' | 'completed' | 'stopped' | 'archived';
type KnowledgeMetadata = { id: string; type: KnowledgeItemType; path: string; title: string; status: KnowledgeStatus; createdAt: string; updatedAt: string; version: number; contentHash: string; topicIds: string[]; tags: string[]; relatedIds: string[]; sourceUrl?: string; reason?: string; supersedesId?: string; archivedAt?: string };
type KnowledgeUsage = { id: string; createdAt: string; itemVersions: Array<{ id: string; version: number; contentHash: string }>; sourceHashes: Record<string, string>; targetPath?: string };
type AssistantMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };
type AssistantSession = { id: string; kind: 'knowledge' | 'analysis'; title: string; provider: ExecutionMode; lastProvider?: ExecutionMode; status: 'active' | 'completed'; createdAt: string; updatedAt: string; messages: AssistantMessage[]; knowledgePaths: string[]; includeSources: boolean; apiResponseId?: string; codexThreadId?: string; outputPath?: string };
type MarketingTimelineItem = { id: string; title: string; startDate: string; endDate?: string; status: 'planned' | 'active' | 'done'; notes?: string; tags: string[]; contentPaths: string[]; assetPaths: string[]; createdAt: string; updatedAt: string };
type MarketingTodo = { id: string; title: string; dueDate?: string; status: 'todo' | 'doing' | 'done'; notes?: string; timelineId?: string; contentPaths: string[]; assetPaths: string[]; createdAt: string; updatedAt: string };
type MarketingData = { timeline: MarketingTimelineItem[]; todos: MarketingTodo[] };
type Workspace = { memory: Record<MemoryKey, string>; sources: Source[]; sourceSnapshots: SourceSnapshot[]; records: WorkFile[]; outputs: WorkFile[]; assetMetadata: AssetMetadata[]; contentMetadata: ContentMetadata[]; knowledgeFiles: WorkFile[]; knowledgeMetadata: KnowledgeMetadata[]; knowledgeUsage: KnowledgeUsage[]; knowledgeAliases: Record<string, string[]>; assistantSessions: AssistantSession[]; marketing: MarketingData; lastSyncAt: string };
type CodexResultFile = { path: string; name: string; content: string; updatedAt: string };
type CodexRun = {
  id: string;
  requestPath: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  finalResponse?: string;
  error?: string;
  phase?: 'queued' | 'working' | 'result-ready' | 'completed' | 'cancelled';
  resultFiles: CodexResultFile[];
  threadId?: string;
};

const SOURCE_URLS: Record<string, string> = {
  requirements: 'https://lumiterra-balance-lab.vercel.app/requirements.md',
  numeric: 'https://lumiterra-balance-lab.vercel.app/numeric-core.md',
};

const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: '工作台' },
  { id: 'documents', label: '文档与分析' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'content', label: '内容创作' },
  { id: 'assets', label: '素材工作室' },
  { id: 'knowledge', label: '知识库' },
];
const VIEW_STORAGE_KEY = 'lumiterra-last-view';

function isView(value: unknown): value is View {
  return typeof value === 'string' && NAV.some((item) => item.id === value);
}

function viewFromHash() {
  const value = window.location.hash.replace(/^#/, '');
  return isView(value) ? value : undefined;
}

function formatTime(value?: string) {
  if (!value) return '尚未同步';
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function stripTitle(content = '') {
  return content.replace(/^#\s+.*(?:\r?\n)+/, '').trim();
}

function parseJsonResponse<T>(content: string): T {
  return JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')) as T;
}

function MarkdownView({ content, className = '', linksNewTab = false }: { content: string; className?: string; linksNewTab?: boolean }) {
  const components = linksNewTab ? {
    a: ({ node, ...props }: React.ComponentPropsWithoutRef<'a'> & { node?: unknown }) => {
      void node;
      return <a {...props} target="_blank" rel="noopener noreferrer" />;
    },
  } : undefined;
  return <div className={`markdown-body ${className}`}><ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>{content || '暂无内容'}</ReactMarkdown></div>;
}

function displayName(file: WorkFile) {
  return file.name.replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-/, '').replaceAll('-', ' ');
}

function compareText(before = '', after = ''): Pick<SourceChange, 'added' | 'removed' | 'addedLines' | 'removedLines'> {
  const oldLines = new Set(before.split('\n').map((line) => line.trim()).filter(Boolean));
  const newLines = new Set(after.split('\n').map((line) => line.trim()).filter(Boolean));
  const addedLines = [...newLines].filter((line) => !oldLines.has(line));
  const removedLines = [...oldLines].filter((line) => !newLines.has(line));
  return { added: addedLines.length, removed: removedLines.length, addedLines, removedLines };
}

async function api<T>(body?: object): Promise<T> {
  const response = await fetch('/api/workspace', body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : { cache: 'no-store' });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || '操作失败');
  return result as T;
}

async function executeCodex(requestPath: string, update: (run: CodexRun) => void, onProgress?: (run: CodexRun) => void | Promise<void>, threadId?: string, lane: 'text' | 'image' = 'text', directPrompt?: string) {
  const startResponse = await fetch('/api/codex', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestPath, threadId, lane, directPrompt }),
  });
  let run = await startResponse.json() as CodexRun & { error?: string };
  if (!startResponse.ok) throw new Error(run.error || '无法启动 Codex');
  update(run);
  await onProgress?.(run);
  while (run.status === 'queued' || run.status === 'running') {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const response = await fetch(`/api/codex?id=${encodeURIComponent(run.id)}`, { cache: 'no-store' });
    run = await response.json() as CodexRun & { error?: string };
    if (!response.ok) throw new Error(run.error || '无法读取 Codex 状态');
    update(run);
    await onProgress?.(run);
  }
  return run;
}

function CodexRunView({ run }: { run: CodexRun | null }) {
  if (!run) return null;
  if (run.status === 'queued' || run.status === 'running') {
    return <div className="codex-run running"><span className="run-dot" /><div><strong>{run.phase === 'result-ready' ? '图片已生成' : 'Codex 正在处理'}</strong><p>{run.phase === 'result-ready' ? '结果已显示，正在保存创作说明与执行记录。' : '正在准备参考并生成结果。'}</p></div></div>;
  }
  if (run.status === 'failed') {
    return <div className="codex-run failed"><div><strong>执行未完成</strong><p>{run.error || 'Codex 执行失败'}</p></div></div>;
  }
  if (run.status === 'cancelled') {
    return <div className="codex-run cancelled"><div><strong>已取消</strong><p>没有保存分析半成品。</p></div></div>;
  }
  return <div className="codex-run completed"><div className="codex-run-head"><strong>已完成</strong><span>{run.resultFiles.length ? '结果已保存到当前工作区' : '执行记录已保存'}</span></div></div>;
}

export default function Home() {
  const [view, setActiveView] = useState<View>('dashboard');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);

  function setView(next: View) {
    setActiveView(next);
    window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    if (viewFromHash() !== next) window.history.pushState({ view: next }, '', `#${next}`);
  }

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    try { setWorkspace(await api<Workspace>()); }
    catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '读取失败' }); }
    finally { if (!silent) { setLoading(false); setShowLoading(false); } }
  }

  useEffect(() => {
    const hashView = viewFromHash();
    const savedView = window.localStorage.getItem(VIEW_STORAGE_KEY);
    const initialView = hashView ?? (isView(savedView) ? savedView : 'dashboard');
    const viewTimer = window.setTimeout(() => setActiveView(initialView), 0);
    window.localStorage.setItem(VIEW_STORAGE_KEY, initialView);
    if (!hashView) window.history.replaceState({ view: initialView }, '', `#${initialView}`);

    const restoreHistoryView = (event: PopStateEvent) => {
      const next = isView(event.state?.view) ? event.state.view : (viewFromHash() ?? 'dashboard');
      setActiveView(next);
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    };
    window.addEventListener('popstate', restoreHistoryView);

    let active = true;
    api<Workspace>()
      .then((data) => { if (active) setWorkspace(data); })
      .catch((error) => { if (active) setNotice({ tone: 'error', text: error instanceof Error ? error.message : '读取失败' }); })
      .finally(() => { if (active) { setLoading(false); setShowLoading(false); } });
    return () => { active = false; window.clearTimeout(viewTimer); window.removeEventListener('popstate', restoreHistoryView); };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setShowLoading(true), 250);
    return () => window.clearTimeout(timer);
  }, [loading]);

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView('dashboard')} type="button"><span className="brand-mark">L</span><span>Lumiterra V2<small>运营工作台</small></span></button>
      <nav aria-label="主导航">{NAV.map((item) => <button className={view === item.id ? 'active' : ''} key={item.id} onClick={() => setView(item.id)} type="button">{item.label}</button>)}</nav>
      <div className="header-actions"><button onClick={() => setMemoryOpen(true)} type="button">项目记忆</button><button onClick={() => refresh()} type="button">刷新</button></div>
    </header>

    {notice && <div className={`notice ${notice.tone}`}><span>{notice.text}</span><button onClick={() => setNotice(null)} type="button">×</button></div>}
    {showLoading && !workspace && <div className="loading">正在读取项目内容…</div>}
    {!loading && !workspace && <div className="loading">无法读取工作台</div>}
    {workspace && view === 'dashboard' && <Dashboard workspace={workspace} setView={setView} />}
    {workspace && view === 'documents' && <Documents workspace={workspace} refresh={refresh} setNotice={setNotice} />}
    {workspace && view === 'marketing' && <MarketingBoard workspace={workspace} refresh={refresh} setNotice={setNotice} setView={setView} />}
    {workspace && view === 'content' && <ContentWorkbench workspace={workspace} refresh={refresh} setNotice={setNotice} setView={setView} />}
    {workspace && view === 'knowledge' && <KnowledgeBase workspace={workspace} refresh={refresh} setNotice={setNotice} />}
    {workspace && <div hidden={view !== 'assets'}><AssetStudio workspace={workspace} refresh={refresh} setNotice={setNotice} active={view === 'assets'} /></div>}
    {workspace && memoryOpen && <MemoryDrawer workspace={workspace} refresh={refresh} close={() => setMemoryOpen(false)} setNotice={setNotice} />}
  </main>;
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="section-title"><h1>{title}</h1>{action}</div>;
}

function Dashboard({ workspace, setView }: { workspace: Workspace; setView: (view: View) => void }) {
  const requests = workspace.records.filter((file) => file.path.includes('/requests/') && file.content?.includes('状态：待处理'));
  const recent = [...workspace.records, ...workspace.outputs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  return <div className="page">
    <SectionTitle title="工作台" action={<span className="phase">当前阶段：V2 Early Prototype</span>} />
    <div className="dashboard-bottom">
      <section className="box dashboard-active"><BoxHeader title="进行中的工作" action={<strong>{requests.length}</strong>} />{requests.length === 0 && <Empty text="目前没有等待处理的工作" />}{requests.slice(0, 6).map((file) => <button className="history-row actionable" key={file.path} onClick={() => setView(file.content?.includes('类型：分析') ? 'documents' : file.content?.includes('输出类型：assets') ? 'assets' : 'content')} type="button"><span>待处理</span><strong>{displayName(file)}</strong><small>继续 →</small></button>)}</section>
      <section className="box dashboard-recent"><BoxHeader title="最近产出" />{recent.length === 0 && <Empty text="暂无记录" />}{recent.map((file) => <div className="history-row" key={file.path}><span>{file.path.startsWith('outputs/') ? '产出' : '记录'}</span><strong>{displayName(file)}</strong><small>{formatTime(file.updatedAt)}</small></div>)}</section>
      <section className="box focus-strip"><BoxHeader title="当前运营重点" /><MarkdownView content={workspace.memory.current} className="compact-document" /></section>
    </div>
  </div>;
}

function BoxHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="box-header"><h2>{title}</h2>{action}</div>;
}

function Empty({ text }: { text: string }) { return <div className="empty">{text}</div>; }

function Documents({ workspace, refresh, setNotice }: { workspace: Workspace; refresh: (silent?: boolean) => Promise<void>; setNotice: (notice: Notice) => void }) {
  const [selected, setSelected] = useState(`source:${workspace.sources[0]?.id ?? 'requirements'}`);
  const [syncing, setSyncing] = useState(false);
  const [changes, setChanges] = useState<SourceChange[]>([]);
  const [sourceMode, setSourceMode] = useState<'current' | 'changes' | 'history'>('current');
  const [selectedSnapshot, setSelectedSnapshot] = useState('');
  const [analysisTitle, setAnalysisTitle] = useState('V2 产品理解分析');
  const [question, setQuestion] = useState('结合当前项目记忆和产品文档，梳理已确认事实、运营判断与待确认问题，并指出对外表达需要注意的内容。');
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const analysisRequests = workspace.records.filter((file) => file.path.includes('/requests/') && file.content?.includes('类型：分析')).slice(0, 5);
  const analysisOutputs = workspace.outputs.filter((file) => file.path.startsWith('outputs/documents/')).slice(0, 5);
  const selectedSource = selected.startsWith('source:') ? workspace.sources.find((item) => `source:${item.id}` === selected) : undefined;
  const selectedFile = [...analysisOutputs, ...analysisRequests].find((file) => file.path === selected);
  const activeChange = selectedSource ? changes.find((item) => item.id === selectedSource.id && item.changed) : undefined;
  const sourceSnapshots = selectedSource ? workspace.sourceSnapshots.filter((file) => file.sourceId === selectedSource.id) : [];
  const activeSnapshot = sourceSnapshots.find((file) => file.path === selectedSnapshot) ?? sourceSnapshots[0];
  const activeSnapshotIndex = activeSnapshot ? sourceSnapshots.findIndex((file) => file.path === activeSnapshot.path) : -1;
  const versionAfterSnapshot = activeSnapshotIndex > 0 ? sourceSnapshots[activeSnapshotIndex - 1]?.content : selectedSource?.content;
  const historyChange = selectedSource && activeSnapshot ? compareText(activeSnapshot.content, versionAfterSnapshot) : undefined;
  const documentTitle = selectedSource?.title ?? (selectedFile ? displayName(selectedFile) : '文档');
  const documentContent = selectedSource?.content ?? selectedFile?.content ?? '暂无内容';
  const documentMeta = selectedSource ? `产品来源 · ${formatTime(selectedSource.updatedAt)}` : selectedFile ? `${selectedFile.path.includes('/requests/') ? '分析任务' : '分析结果'} · ${formatTime(selectedFile.updatedAt)}` : '';

  async function sync() {
    setSyncing(true);
    try {
      const entries = await Promise.all(Object.entries(SOURCE_URLS).map(async ([id, url]) => { const response = await fetch(url, { cache: 'no-store' }); if (!response.ok) throw new Error(`无法读取${id}`); return [id, await response.text()] as const; }));
      const result = await api<{ changes: SourceChange[] }>({ action: 'syncSources', documents: Object.fromEntries(entries) });
      setChanges(result.changes); await refresh(true);
      const count = result.changes.filter((item) => item.changed).length;
      const firstChanged = result.changes.find((item) => item.changed);
      if (firstChanged) { setSelected(`source:${firstChanged.id}`); setSourceMode('changes'); }
      setNotice({ tone: 'success', text: count ? `已保存 ${count} 份文档更新` : '产品文档没有变化' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '同步失败' }); }
    finally { setSyncing(false); }
  }

  function prepareChangeAnalysis(change: SourceChange | Pick<SourceChange, 'title' | 'addedLines' | 'removedLines'>) {
    setAnalysisTitle(`${change.title}更新影响分析`);
    setQuestion(`只分析下面这次文档变化，并说明：1. 产品发生了什么变化；2. 对运营叙事和已有内容的影响；3. 哪些内容仍需团队确认；4. 哪些公开表达需要调整。\n\n新增内容：\n${change.addedLines.map((line) => `+ ${line}`).join('\n') || '无'}\n\n删除内容：\n${change.removedLines.map((line) => `- ${line}`).join('\n') || '无'}`);
    setAnalysisOpen(true);
  }

  return <div className="page">
    <SectionTitle title="文档与分析" action={<div className="title-actions"><button onClick={sync} disabled={syncing} type="button">{syncing ? '正在同步…' : '检查文档更新'}</button><button className="primary" onClick={() => setAnalysisOpen(true)} type="button">新建分析</button></div>} />
    {changes.length > 0 && <div className="sync-results">{changes.map((item) => <div className={item.changed ? 'changed' : ''} key={item.title}><span><b>{item.title}</b>{item.changed ? `新增 ${item.added} · 删除 ${item.removed}` : '无变化'}</span>{item.changed && <div><button onClick={() => { setSelected(`source:${item.id}`); setSourceMode('changes'); }} type="button">查看变更</button><button onClick={() => prepareChangeAnalysis(item)} type="button">分析更新</button></div>}</div>)}</div>}

    <div className="document-workspace reader-first">
      <aside className="box document-nav"><BoxHeader title="文档" />
        <p>产品来源</p>{workspace.sources.map((item) => <button className={selected === `source:${item.id}` ? 'active' : ''} onClick={() => { setSelected(`source:${item.id}`); setSourceMode('current'); }} key={item.id} type="button"><strong>{item.title}</strong><small>{item.content ? formatTime(item.updatedAt) : '未同步'}</small></button>)}
        <p>分析结果</p>{analysisOutputs.length === 0 && <small className="nav-empty">暂无结果</small>}{analysisOutputs.map((file) => <button className={selected === file.path ? 'active' : ''} onClick={() => setSelected(file.path)} key={file.path} type="button"><strong>{displayName(file)}</strong><small>{formatTime(file.updatedAt)}</small></button>)}
        <p>分析任务</p>{analysisRequests.length === 0 && <small className="nav-empty">暂无任务</small>}{analysisRequests.map((file) => <button className={selected === file.path ? 'active' : ''} onClick={() => setSelected(file.path)} key={file.path} type="button"><strong>{displayName(file)}</strong><small>{file.content?.includes('状态：已完成') ? '已完成' : file.content?.includes('状态：已取消') ? '已取消' : '待处理'}</small></button>)}
      </aside>
      <section className="box document-view"><div className="document-view-head"><div><h2>{documentTitle}</h2><span>{documentMeta}</span></div>{selectedSource && <div className="document-tabs"><button className={sourceMode === 'current' ? 'active' : ''} onClick={() => setSourceMode('current')} type="button">当前文档</button><button className={sourceMode === 'changes' ? 'active' : ''} onClick={() => setSourceMode('changes')} type="button">本次变更</button><button className={sourceMode === 'history' ? 'active' : ''} onClick={() => setSourceMode('history')} type="button">历史版本</button></div>}</div>
        {(!selectedSource || sourceMode === 'current') && <MarkdownView content={documentContent} />}
        {selectedSource && sourceMode === 'changes' && (activeChange ? <SourceDiffView change={activeChange} analyze={() => prepareChangeAnalysis(activeChange)} /> : <Empty text="本次打开工作台后还没有检测到新的变化。可以在历史版本中比较已保存的版本。" />)}
        {selectedSource && sourceMode === 'history' && <div className="history-compare"><aside><h3>更新记录</h3>{sourceSnapshots.length === 0 && <Empty text="暂无历史版本" />}{sourceSnapshots.map((file) => <button className={activeSnapshot?.path === file.path ? 'active' : ''} onClick={() => setSelectedSnapshot(file.path)} key={file.path} type="button"><strong>{formatTime(file.updatedAt)}</strong><small>查看这次更新</small></button>)}</aside><div>{historyChange && activeSnapshot ? <SourceDiffView change={{ id: selectedSource.id, title: `${selectedSource.title} · ${formatTime(activeSnapshot.updatedAt)} 更新`, changed: Boolean(historyChange.added || historyChange.removed), ...historyChange }} analyze={() => prepareChangeAnalysis({ title: selectedSource.title, ...historyChange })} /> : <Empty text="选择一条更新记录查看差异" />}</div></div>}
      </section>
    </div>
    {analysisOpen && <AiWorkspaceModal mode="analysis" workspace={workspace} initialTitle={analysisTitle} initialPrompt={question} onClose={() => setAnalysisOpen(false)} onSaved={(path) => setSelected(path)} refresh={refresh} setNotice={setNotice} />}
  </div>;
}

function SourceDiffView({ change, analyze }: { change: SourceChange; analyze: () => void }) {
  if (!change.changed) return <Empty text="这个版本与当前文档没有内容差异" />;
  return <div className="diff-view">
    <div className="diff-summary"><div><strong>{change.title}</strong><span>新增 {change.added} · 删除 {change.removed}</span></div><button className="primary" onClick={analyze} type="button">分析本次更新</button></div>
    <div className="diff-columns">
      <section><h3>新增内容 <span>{change.added}</span></h3>{change.addedLines.length === 0 && <p className="diff-empty">没有新增内容</p>}{change.addedLines.map((line, index) => <p className="added" key={`${index}-${line}`}><i>+</i><span>{line}</span></p>)}</section>
      <section><h3>删除内容 <span>{change.removed}</span></h3>{change.removedLines.length === 0 && <p className="diff-empty">没有删除内容</p>}{change.removedLines.map((line, index) => <p className="removed" key={`${index}-${line}`}><i>−</i><span>{line}</span></p>)}</section>
    </div>
  </div>;
}

function ContextList() {
  return <div className="context-summary"><span>本次参考</span><strong>项目记忆 · 需求文档 · 数值文档</strong><button type="button" title="当前阶段自动使用与任务相关的项目上下文">自动</button></div>;
}

function knowledgeReferenceText(workspace: Workspace, paths: string[], limit = 24_000) {
  let remaining = limit;
  return paths.map((path) => {
    if (remaining <= 0) return '';
    const metadata = workspace.knowledgeMetadata.find((item) => item.path === path && item.status !== 'archived');
    const file = workspace.knowledgeFiles.find((item) => item.path === path);
    if (!metadata || !file?.content) return '';
    const content = file.content.slice(0, remaining);
    remaining -= content.length;
    return `【知识库参考 · ${metadata.title}】\n${content}`;
  }).filter(Boolean).join('\n\n');
}

function recommendKnowledgePaths(workspace: Workspace, query: string, limit = 3, types?: KnowledgeItemType[]) {
  const normalized = query.toLowerCase();
  const latin = normalized.match(/[a-z0-9]{3,}/g) ?? [];
  const chinese = normalized.replace(/[^\u4e00-\u9fff]/g, '');
  const terms = [...new Set([...latin, ...Array.from({ length: Math.max(0, chinese.length - 1) }, (_, index) => chinese.slice(index, index + 2))])];
  return workspace.knowledgeMetadata.filter((item) => item.status !== 'archived' && (!types || types.includes(item.type))).map((item) => {
    const file = workspace.knowledgeFiles.find((entry) => entry.path === item.path);
    const text = [item.title, ...item.tags, file?.content].filter(Boolean).join('\n').toLowerCase();
    return { path: item.path, updatedAt: item.updatedAt, score: terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0) };
  }).sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit).map((item) => item.path);
}

function KnowledgeReferencePicker({ workspace, selected, onChange, query = '', label = '知识库参考', emptyLabel = '选择资料', types = ['topic', 'insight', 'source', 'discussion'] }: { workspace: Workspace; selected: string[]; onChange: (paths: string[]) => void; query?: string; label?: string; emptyLabel?: string; types?: KnowledgeItemType[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | KnowledgeItemType>('all');
  const [pendingSelected, setPendingSelected] = useState<string[]>(selected);
  const [previewPath, setPreviewPath] = useState('');
  const normalized = search.trim().toLowerCase();
  const topicOnly = types.length === 1 && types[0] === 'topic';
  const availableTypes = [...new Set(types)];
  const items = workspace.knowledgeMetadata.filter((item) => item.status !== 'archived' && types.includes(item.type) && (typeFilter === 'all' || item.type === typeFilter)).filter((item) => {
    if (!normalized) return true;
    const file = workspace.knowledgeFiles.find((entry) => entry.path === item.path);
    return [item.title, ...item.tags, file?.content].filter(Boolean).join('\n').toLowerCase().includes(normalized);
  }).sort((a, b) => (a.type === 'topic' ? -1 : b.type === 'topic' ? 1 : b.updatedAt.localeCompare(a.updatedAt)));
  const selectedTitles = selected.flatMap((path) => workspace.knowledgeMetadata.find((item) => item.path === path)?.title ?? []);
  const previewMetadata = workspace.knowledgeMetadata.find((item) => item.path === previewPath) ?? items[0];
  const previewFile = workspace.knowledgeFiles.find((item) => item.path === previewMetadata?.path);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeOnEscape); };
  }, [open]);

  function excerpt(path: string) {
    const file = workspace.knowledgeFiles.find((item) => item.path === path);
    return stripTitle(file?.content ?? '').replace(/[#>*_`|\[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150) || '暂无摘要';
  }
  function openPicker() {
    setPendingSelected(selected);
    setSearch('');
    setTypeFilter('all');
    setPreviewPath(selected.at(-1) ?? workspace.knowledgeMetadata.find((item) => item.status !== 'archived' && types.includes(item.type))?.path ?? '');
    setOpen(true);
  }
  function toggle(path: string) { setPendingSelected((current) => current.includes(path) ? current.filter((item) => item !== path) : [...current, path].slice(-12)); }
  function confirmSelection() { onChange(pendingSelected); setOpen(false); }
  return <div className="knowledge-reference-picker">
    <button className={selected.length ? 'knowledge-reference-trigger active' : 'knowledge-reference-trigger'} onClick={openPicker} type="button"><span>{label}</span><strong>{selectedTitles.length ? `${selectedTitles[0]}${selectedTitles.length > 1 ? ` +${selectedTitles.length - 1}` : ''}` : emptyLabel}</strong></button>
    {open && <div className="knowledge-picker-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="knowledge-picker-panel" role="dialog" aria-modal="true" aria-label={topicOnly ? '选择主题' : '选择知识库资料'}>
        <div className="knowledge-picker-head"><div><span>{label}</span><strong>{topicOnly ? '选择主题' : '选择知识库资料'}</strong></div><button onClick={() => setOpen(false)} type="button" aria-label="关闭资料选择">×</button></div>
        <div className="knowledge-picker-tools"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={topicOnly ? '搜索主题' : '搜索标题、摘要或标签'} autoFocus /><button onClick={() => { const recommended = recommendKnowledgePaths(workspace, query, 3, types); setPendingSelected(recommended); setPreviewPath(recommended[0] ?? ''); }} disabled={!workspace.knowledgeMetadata.length} type="button">智能推荐</button></div>
        {!topicOnly && <div className="knowledge-picker-filters"><button className={typeFilter === 'all' ? 'active' : ''} onClick={() => setTypeFilter('all')} type="button">全部</button>{availableTypes.map((type) => <button className={typeFilter === type ? 'active' : ''} onClick={() => setTypeFilter(type)} type="button" key={type}>{knowledgeTypeLabel(type)}</button>)}</div>}
        <div className="knowledge-picker-body">
          <div className="knowledge-picker-list">{items.length === 0 ? <Empty text="没有找到相关资料" /> : items.map((item) => <div className={`${previewMetadata?.path === item.path ? 'previewing' : ''} ${pendingSelected.includes(item.path) ? 'active' : ''}`} key={item.id}><button className="knowledge-picker-check" onClick={() => toggle(item.path)} type="button" aria-label={`${pendingSelected.includes(item.path) ? '取消选择' : '选择'} ${item.title}`}>{pendingSelected.includes(item.path) ? '✓' : '+'}</button><button className="knowledge-picker-item" onClick={() => setPreviewPath(item.path)} type="button"><strong>{item.title}</strong><p>{excerpt(item.path)}</p><small>{knowledgeTypeLabel(item.type)}{item.tags.length ? ` · ${item.tags.slice(0, 2).join(' · ')}` : ''} · {formatTime(item.updatedAt)}</small></button></div>)}</div>
          <aside className="knowledge-picker-preview">{previewMetadata && previewFile ? <><div><span>{knowledgeTypeLabel(previewMetadata.type)}</span><strong>{previewMetadata.title}</strong><small>更新于 {formatTime(previewMetadata.updatedAt)}{previewMetadata.sourceUrl ? ' · 含源头链接' : ''}</small></div><MarkdownView content={previewFile.content ?? ''} linksNewTab /></> : <Empty text="点击左侧资料查看内容" />}</aside>
        </div>
        <div className="knowledge-picker-footer"><button className="knowledge-picker-clear" onClick={() => setPendingSelected([])} disabled={!pendingSelected.length} type="button">清空</button><span>已选 {pendingSelected.length} 项，确认后用于本次任务</span><div><button onClick={() => setOpen(false)} type="button">取消</button><button className="primary" onClick={confirmSelection} type="button">确认选择{pendingSelected.length ? `（${pendingSelected.length}）` : ''}</button></div></div>
      </section>
    </div>}
  </div>;
}

function AiWorkspaceModal({ mode, workspace, initialTitle, initialPrompt = '', initialKnowledgePaths = [], onClose, onSaved, refresh, setNotice }: { mode: 'knowledge' | 'analysis'; workspace: Workspace; initialTitle: string; initialPrompt?: string; initialKnowledgePaths?: string[]; onClose: () => void; onSaved?: (path: string) => void; refresh: (silent?: boolean) => Promise<void>; setNotice: (notice: Notice) => void }) {
  const latestSession = workspace.assistantSessions?.find((item) => item.kind === mode && item.status === 'active');
  const [tab, setTab] = useState<'chat' | 'direct'>('chat');
  const [sessionId, setSessionId] = useState('');
  const [title, setTitle] = useState(initialTitle);
  const [provider, setProvider] = useState<ExecutionMode>('codex');
  const [lastProvider, setLastProvider] = useState<ExecutionMode | undefined>();
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [knowledgePaths, setKnowledgePaths] = useState(initialKnowledgePaths);
  const [includeSources, setIncludeSources] = useState(mode === 'analysis');
  const [apiResponseId, setApiResponseId] = useState('');
  const [codexThreadId, setCodexThreadId] = useState('');
  const [input, setInput] = useState(initialPrompt);
  const [working, setWorking] = useState(false);
  const [codexRun, setCodexRun] = useState<CodexRun | null>(null);
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [errorText, setErrorText] = useState('');
  const [directType, setDirectType] = useState<KnowledgeItemType>('source');
  const [directTitle, setDirectTitle] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [directContent, setDirectContent] = useState('');
  const [directTags, setDirectTags] = useState('');
  const [draftReady, setDraftReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef('');
  const draftStorageKey = `lumiterra-${mode}-assistant-draft`;

  useEffect(() => {
    fetch('/api/assistant', { cache: 'no-store' }).then(async (response) => await response.json() as { configured?: boolean }).then((result) => setApiConfigured(Boolean(result.configured))).catch(() => setApiConfigured(false));
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!initialKnowledgePaths.length) {
        try {
          const saved = JSON.parse(sessionStorage.getItem(draftStorageKey) ?? '{}') as { tab?: 'chat' | 'direct'; title?: string; provider?: ExecutionMode; input?: string; includeSources?: boolean; knowledgePaths?: string[]; directType?: KnowledgeItemType; directTitle?: string; directUrl?: string; directContent?: string; directTags?: string };
          if (saved.tab) setTab(saved.tab);
          if (saved.title) setTitle(saved.title);
          if (saved.provider) setProvider(saved.provider);
          if (typeof saved.includeSources === 'boolean') setIncludeSources(saved.includeSources);
          if (Array.isArray(saved.knowledgePaths)) setKnowledgePaths(saved.knowledgePaths);
          if (saved.input) setInput(saved.input);
          if (saved.directType) setDirectType(saved.directType);
          if (saved.directTitle) setDirectTitle(saved.directTitle);
          if (saved.directUrl) setDirectUrl(saved.directUrl);
          if (saved.directContent) setDirectContent(saved.directContent);
          if (saved.directTags) setDirectTags(saved.directTags);
        } catch {}
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [draftStorageKey, initialKnowledgePaths.length]);

  useEffect(() => {
    if (!draftReady) return;
    sessionStorage.setItem(draftStorageKey, JSON.stringify({ tab, title, provider, input, includeSources, knowledgePaths, directType, directTitle, directUrl, directContent, directTags }));
  }, [draftReady, draftStorageKey, tab, title, provider, input, includeSources, knowledgePaths, directType, directTitle, directUrl, directContent, directTags]);

  async function persist(nextMessages: AssistantMessage[], extra: Partial<AssistantSession> = {}) {
    const result = await api<AssistantSession>({ action: 'saveAssistantSession', id: sessionId || undefined, kind: mode, title, provider, lastProvider: extra.lastProvider ?? lastProvider, status: extra.status ?? 'active', messages: nextMessages, knowledgePaths, includeSources, apiResponseId: (extra.apiResponseId ?? apiResponseId) || undefined, codexThreadId: (extra.codexThreadId ?? codexThreadId) || undefined, outputPath: extra.outputPath });
    if (!sessionId) setSessionId(result.id);
    return result;
  }

  function startNew() {
    if ((messages.length || input.trim()) && !window.confirm('开始新对话会清空当前未保存的对话输入，是否继续？')) return;
    sessionStorage.removeItem(draftStorageKey);
    setSessionId(''); setTitle(initialTitle); setProvider('codex'); setLastProvider(undefined); setMessages([]); setKnowledgePaths(initialKnowledgePaths); setIncludeSources(mode === 'analysis'); setApiResponseId(''); setCodexThreadId(''); setInput(initialPrompt); setCodexRun(null); setErrorText(''); setTab('chat');
  }

  function resumeLatest() {
    if (!latestSession) return;
    setSessionId(latestSession.id); setTitle(latestSession.title); setProvider(latestSession.provider); setLastProvider(latestSession.lastProvider); setMessages(latestSession.messages); setKnowledgePaths(latestSession.knowledgePaths); setIncludeSources(latestSession.includeSources); setApiResponseId(latestSession.apiResponseId ?? ''); setCodexThreadId(latestSession.codexThreadId ?? ''); setInput(''); setTab('chat'); setErrorText('');
  }

  async function addInsight(content: string, insightTitle = `${title} · 核心结论`) {
    const topicIds = knowledgePaths.flatMap((path) => {
      const item = workspace.knowledgeMetadata.find((entry) => entry.path === path);
      return item?.type === 'topic' ? [item.id] : item?.topicIds ?? [];
    });
    const relatedIds = knowledgePaths.flatMap((path) => workspace.knowledgeMetadata.find((entry) => entry.path === path)?.id ?? []);
    const result = await api<{ path: string }>({ action: 'createKnowledgeItem', type: 'insight', title: insightTitle, content, reason: '由工作台多轮讨论整理，保留为可复用运营结论。', topicIds, relatedIds });
    await refresh(true);
    onSaved?.(result.path);
    setNotice({ tone: 'success', text: '结论已加入知识库' });
    return result.path;
  }

  async function runTurn(promptOverride?: string, addAfter = false) {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || working) return;
    const userMessage: AssistantMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages); setInput(''); setWorking(true); setErrorText(''); setCodexRun(null);
    try {
      let content = '';
      let nextApiId = apiResponseId;
      let nextCodexId = codexThreadId;
      if (provider === 'api') {
        const controller = new AbortController(); abortRef.current = controller;
        const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ kind: mode, prompt, messages, knowledgePaths, includeSources, previousResponseId: lastProvider === 'api' ? apiResponseId : undefined }) });
        const result = await response.json() as { content?: string; responseId?: string; error?: string };
        if (!response.ok || !result.content) throw new Error(result.error || 'API 对话未完成');
        content = result.content; nextApiId = result.responseId ?? '';
      } else {
        const transcript = lastProvider === 'codex' ? '' : messages.slice(-12).map((item) => `${item.role === 'user' ? '用户' : '助手'}：${item.content}`).join('\n\n');
        let sourceRemaining = 60_000;
        const sourceContext = includeSources ? workspace.sources.map((source) => { const part = source.content.slice(0, sourceRemaining); sourceRemaining -= part.length; return part ? `【产品事实来源 · ${source.title}】\n${part}` : ''; }).filter(Boolean).join('\n\n') : '';
        const directPrompt = [
          mode === 'analysis' ? '你是 Lumiterra V2 运营研究与产品分析助手。' : '你是 Lumiterra V2 运营知识协作助手。',
          '这是网页端多轮对话。只返回本轮中文回复，不创建、修改或读取任何本地文件，也不调用工具。',
          '必须区分已确认产品事实、运营解释或建议、仍需确认的假设；知识库资料不能覆盖产品来源。',
          transcript ? `【此前对话】\n${transcript}` : '', knowledgeReferenceText(workspace, knowledgePaths), sourceContext, `【本轮用户输入】\n${prompt}`,
        ].filter(Boolean).join('\n\n');
        const run = await executeCodex('', (value) => { setCodexRun(value); runIdRef.current = value.id; }, undefined, lastProvider === 'codex' ? codexThreadId : undefined, 'text', directPrompt);
        if (run.status === 'cancelled') return;
        if (run.status === 'failed' || !run.finalResponse?.trim()) throw new Error(run.error || 'Codex 对话未完成');
        content = run.finalResponse.trim(); nextCodexId = run.threadId ?? '';
      }
      const assistantMessage: AssistantMessage = { id: crypto.randomUUID(), role: 'assistant', content, createdAt: new Date().toISOString() };
      const completedMessages = [...nextMessages, assistantMessage];
      setMessages(completedMessages); setLastProvider(provider); setApiResponseId(nextApiId); setCodexThreadId(nextCodexId);
      await persist(completedMessages, { lastProvider: provider, apiResponseId: nextApiId, codexThreadId: nextCodexId });
      if (addAfter) await addInsight(content);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setErrorText(error instanceof Error ? error.message : '对话未完成');
    } finally { setWorking(false); abortRef.current = null; runIdRef.current = ''; }
  }

  async function cancel() {
    abortRef.current?.abort();
    if (runIdRef.current) await fetch(`/api/codex?id=${encodeURIComponent(runIdRef.current)}`, { method: 'DELETE' }).catch(() => undefined);
    setWorking(false);
  }

  async function saveAnalysis() {
    const content = [...messages].reverse().find((item) => item.role === 'assistant')?.content;
    if (!content) return;
    try {
      const output = await api<{ path: string }>({ action: 'saveOutput', category: 'documents', title, content });
      await api({ action: 'createRecord', title: `${title} · 分析会话`, content: [`- 分析产出：${output.path}`, `- 执行方式：${lastProvider === 'api' ? 'OpenAI API' : 'Codex'}`, `- 引用知识：${knowledgePaths.length ? knowledgePaths.join('、') : '无'}`, '', '## 重要判断', '', '- 最终分析正文已保存；对话过程保留在工作台会话记录中。', '', '## 剩余问题', '', '- 见分析正文中的待确认事项。'].join('\n') });
      if (knowledgePaths.length) await api({ action: 'recordKnowledgeUsage', knowledgePaths, targetPath: output.path });
      await persist(messages, { status: 'completed', outputPath: output.path });
      sessionStorage.removeItem(draftStorageKey);
      await refresh(true); onSaved?.(output.path); setNotice({ tone: 'success', text: '分析结果已保存' }); onClose();
    } catch (error) { setErrorText(error instanceof Error ? error.message : '保存失败'); }
  }

  async function saveDirect() {
    if (!directContent.trim() && !(directType === 'source' && directUrl.trim())) return;
    try {
      if (directType === 'source' && directUrl.trim()) {
        try { new URL(directUrl.trim()); } catch { throw new Error('请输入完整的原始链接，例如 https://example.com/article'); }
      }
      const topicIds = knowledgePaths.flatMap((path) => { const item = workspace.knowledgeMetadata.find((entry) => entry.path === path); return item?.type === 'topic' ? [item.id] : []; });
      const content = [directType === 'source' ? directUrl.trim() : '', directContent.trim()].filter(Boolean).join('\n\n');
      const result = await api<{ path: string }>({ action: 'createKnowledgeItem', type: directType, title: directTitle || undefined, content, tags: directTags.split(/[，,\s]+/).filter(Boolean), topicIds });
      sessionStorage.removeItem(draftStorageKey);
      await refresh(true); onSaved?.(result.path); setNotice({ tone: 'success', text: '知识文档已保存' }); onClose();
    } catch (error) { setErrorText(error instanceof Error ? error.message : '保存失败'); }
  }

  const lastAssistant = [...messages].reverse().find((item) => item.role === 'assistant');
  const canSaveDirect = Boolean(directContent.trim() || (directType === 'source' && directUrl.trim()));
  return <div className="ai-modal-backdrop" onMouseDown={() => !working && onClose()}><section className="ai-workspace-modal" onMouseDown={(event) => event.stopPropagation()}>
    <header className="ai-modal-header"><div><span>{mode === 'analysis' ? '文档与分析' : '知识库'}</span>{tab === 'direct' ? <strong className="ai-direct-title">添加知识文档</strong> : <input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="会话标题" />}</div><div>{tab === 'chat' && latestSession && !sessionId && <button onClick={resumeLatest} type="button">继续上次</button>}{tab === 'chat' && <button onClick={startNew} type="button">新对话</button>}<button onClick={onClose} disabled={working} type="button">关闭</button></div></header>
    {mode === 'knowledge' && <nav className="ai-modal-tabs"><button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')} type="button">讨论与整理</button><button className={tab === 'direct' ? 'active' : ''} onClick={() => setTab('direct')} type="button">直接添加文档</button></nav>}
    {tab === 'direct' ? <div className="knowledge-direct-form"><div className="direct-type-row">{([['source', '源头资料'], ['insight', '结论'], ['topic', '主题'], ['discussion', '讨论记录']] as const).map(([value, label]) => <button className={directType === value ? 'active' : ''} onClick={() => setDirectType(value)} type="button" key={value}>{label}</button>)}</div><div className="direct-field-grid"><label>标题（可选）<input value={directTitle} onChange={(event) => setDirectTitle(event.target.value)} placeholder="不填时自动取正文首行" /></label><label>标签（可选）<input value={directTags} onChange={(event) => setDirectTags(event.target.value)} placeholder="用逗号或空格分隔" /></label></div>{directType === 'source' && <label>原始链接（可选）<input value={directUrl} onChange={(event) => setDirectUrl(event.target.value)} placeholder="https://…" /></label>}<label>正文<textarea value={directContent} onChange={(event) => setDirectContent(event.target.value)} placeholder={directType === 'source' ? '补充摘要、摘录或为什么值得保留…' : '输入需要长期保留的内容…'} /></label><KnowledgeReferencePicker workspace={workspace} selected={knowledgePaths} onChange={setKnowledgePaths} query={`${directTitle}\n${directContent}`} label="归入主题" emptyLabel="选择主题" types={['topic']} /><div className="ai-direct-actions"><span>未保存内容会在本次浏览器会话中自动保留</span><button className="primary" onClick={saveDirect} disabled={!canSaveDirect} type="button">加入知识库</button></div>{errorText && <p className="ai-error">{errorText}</p>}</div> : <>
      <div className="ai-context-bar"><div className="ai-toolbar-group"><span>执行</span><div className="execution-switch"><button className={provider === 'codex' ? 'active' : ''} onClick={() => setProvider('codex')} type="button">Codex</button><button className={provider === 'api' ? 'active' : ''} onClick={() => setProvider('api')} disabled={apiConfigured === false} title={apiConfigured === false ? '尚未配置 OpenAI API' : '使用 OpenAI API'} type="button">OpenAI API</button></div></div><div className="ai-toolbar-group context"><span>本次参考</span>{mode === 'analysis' && <label className="source-toggle"><input type="checkbox" checked={includeSources} onChange={(event) => setIncludeSources(event.target.checked)} />产品文档</label>}<KnowledgeReferencePicker workspace={workspace} selected={knowledgePaths} onChange={setKnowledgePaths} query={`${title}\n${input}\n${messages.map((item) => item.content).join('\n')}`} label="知识库" /></div></div>
      <div className={`ai-chat-stage ${messages.length === 0 ? 'empty' : ''}`}><div className="ai-conversation">{messages.length === 0 ? <div className="ai-conversation-empty"><strong>{mode === 'analysis' ? '把分析变成一段可以继续追问的对话' : '搜集资料、脑暴或讨论判断，都可以从这里开始'}</strong><p>{mode === 'analysis' ? '默认参考最新产品文档；也可选择知识库资料。满意后再保存分析结果。' : '对话不会自动进入知识库。只有点击“加入知识库”时才会沉淀。'}</p></div> : messages.map((message) => <article className={`ai-message ${message.role}`} key={message.id}><span>{message.role === 'user' ? '你' : provider === 'api' ? 'AI' : 'Codex'}</span>{message.role === 'assistant' ? <MarkdownView content={message.content} /> : <p>{message.content}</p>}{message.role === 'assistant' && <button onClick={() => addInsight(message.content, `${title} · 结论`)} type="button">将这条加入知识库</button>}</article>)}{working && <div className="ai-thinking"><span className="run-dot" />正在整理回复…</div>}</div>
      <div className="ai-composer"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void runTurn(); } }} placeholder="输入问题、补充资料或继续追问…" /><div><span>Enter 发送 · Shift+Enter 换行</span>{working ? <button onClick={cancel} type="button">停止</button> : <button className="primary" onClick={() => runTurn()} disabled={!input.trim() || (provider === 'api' && apiConfigured !== true)} type="button">发送</button>}</div></div></div>
      {errorText && <p className="ai-error">{errorText}</p>}<CodexRunView run={codexRun} />
      <footer className="ai-modal-footer"><span>{messages.length ? `已保留 ${messages.length} 条对话` : '尚未开始对话'}</span><div>{lastAssistant && <button onClick={() => runTurn('请基于整段对话整理一份可独立阅读的核心结论。明确区分证据事实、运营判断和待确认假设；去掉对话口吻，保留关键依据与下一步建议。', true)} disabled={working} type="button">总结并加入知识库</button>}{mode === 'analysis' && lastAssistant && <button className="primary" onClick={saveAnalysis} disabled={working} type="button">保存为分析结果</button>}</div></footer>
    </>}
  </section></div>;
}

function FileRow({ file, label, onClick }: { file: WorkFile; label: string; onClick?: () => void }) {
  return <button className="file-row" onClick={onClick} type="button"><span>{label}</span><strong>{displayName(file)}</strong><small>{formatTime(file.updatedAt)}</small></button>;
}

function contentPreview(content = '') {
  return stripTitle(content).split('\n').map((line) => line.replace(/^[-#*>\d.\s]+/, '').trim()).find(Boolean)?.slice(0, 82) || '未命名内容';
}

function normalizedAssetUsage(value?: string) {
  if (value === 'Twitter 配图') return '社交内容配图';
  if (value === '倒计时') return 'Campaign 视觉';
  if (value === 'MEME' || value === '社区内容') return '社区互动';
  return value || '社交内容配图';
}

function relevantContentPaths(query: string, files: WorkFile[], metadata: ContentMetadata[]) {
  const approved = metadata.filter((item) => (item.status === 'final' || item.status === 'published') && !item.reviewRequired);
  const normalized = query.toLowerCase();
  const englishTerms = normalized.match(/[a-z0-9]{3,}/g) ?? [];
  const chinese = normalized.replace(/[^\u4e00-\u9fff]/g, '');
  const terms = [...new Set([...englishTerms, ...Array.from({ length: Math.max(0, chinese.length - 1) }, (_, index) => chinese.slice(index, index + 2))])];
  return approved.map((item) => {
    const content = files.find((file) => file.path === item.path)?.content?.toLowerCase() ?? '';
    return { path: item.path, score: terms.reduce((score, term) => score + (content.includes(term) ? 1 : 0), 0), updatedAt: item.updatedAt };
  }).sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4).map((item) => item.path);
}

function conversationState(metadata: { generator?: ExecutionMode; conversationTurns?: CreationTurn[]; conversationSummary?: string } | undefined, provider: ExecutionMode, instruction: string, forceRestart = false) {
  const previousTurns = metadata?.conversationTurns ?? [];
  const archivePrevious = !forceRestart && Boolean((metadata?.generator && metadata.generator !== provider) || previousTurns.length >= 8);
  const restart = forceRestart || archivePrevious;
  const archived = archivePrevious ? previousTurns.map((turn) => `- ${turn.provider === 'api' ? 'API' : 'Codex'}：${turn.instruction}`) : [];
  const summary = forceRestart ? '' : [metadata?.conversationSummary, ...archived].filter(Boolean).join('\n').slice(-6_000);
  const turn: CreationTurn = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, instruction: instruction.trim().slice(0, 2_000), provider, createdAt: new Date().toISOString() };
  return { restart, summary, turns: [...(restart ? [] : previousTurns), turn].slice(-8) };
}

function ContentWorkbench({ workspace, refresh, setNotice, setView }: { workspace: Workspace; refresh: (silent?: boolean) => Promise<void>; setNotice: (notice: Notice) => void; setView: (view: View) => void }) {
  const files = workspace.outputs.filter((file) => file.path.startsWith('outputs/twitter/'));
  const metadataFor = (path: string) => workspace.contentMetadata.find((item) => item.path === path);
  const [selectedPath, setSelectedPath] = useState('');
  const [instruction, setInstruction] = useState('');
  const [temporaryContext, setTemporaryContext] = useState('');
  const [format, setFormat] = useState<ContentFormat>('post');
  const [language, setLanguage] = useState<ContentLanguage>('en');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(true);
  const [working, setWorking] = useState(false);
  const [codexRun, setCodexRun] = useState<CodexRun | null>(null);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('codex');
  const [apiConfigured, setApiConfigured] = useState<boolean | null>(null);
  const [apiModel, setApiModel] = useState('gpt-5.6-sol');
  const [conversationInput, setConversationInput] = useState('');
  const [knowledgePaths, setKnowledgePaths] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | ContentStatus | 'review'>('all');
  const [draftRestored, setDraftRestored] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [viewingVersionId, setViewingVersionId] = useState('');
  const [directionRun, setDirectionRun] = useState<DirectionRun | null>(null);
  const [factCheck, setFactCheck] = useState<FactCheckResult | null>(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [toneMenuOpen, setToneMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [finalizePending, setFinalizePending] = useState(false);
  const selectedMetadata = metadataFor(selectedPath);
  const contentTurns = selectedMetadata?.conversationTurns ?? [];
  const contentVersions = selectedMetadata?.versions ?? [];
  const latestVersion = contentVersions.at(-1);
  const activeVersionId = viewingVersionId || latestVersion?.id || '';
  const activeVersionIndex = contentVersions.findIndex((version) => version.id === activeVersionId);
  const viewingHistoricalVersion = Boolean(latestVersion && activeVersionId && activeVersionId !== latestVersion.id);
  const savedDraft = stripTitle(files.find((file) => file.path === selectedPath)?.content);
  const hasUnsavedChanges = Boolean(selectedPath && draft.trim() && draft.trim() !== savedDraft.trim());
  const isFinalized = selectedMetadata?.status === 'final' || selectedMetadata?.status === 'published';
  const hasTransientWork = Boolean(directionRun || conversationInput.trim() || hasUnsavedChanges || (!selectedPath && (instruction.trim() || temporaryContext.trim() || draft.trim() || knowledgePaths.length)));
  const linkedAssets = selectedPath ? workspace.assetMetadata.filter((item) => item.source === 'generated' && item.linkedContentPaths?.includes(selectedPath)).map((item) => ({ metadata: item, file: workspace.outputs.find((file) => file.path === item.path) })).filter((item): item is { metadata: AssetMetadata; file: WorkFile } => Boolean(item.file)) : [];
  const approvedCount = workspace.contentMetadata.filter((item) => (item.status === 'final' || item.status === 'published') && !item.reviewRequired).length;
  const latestSourceUpdate = workspace.sources.map((source) => source.updatedAt).filter(Boolean).sort().at(-1);
  const visibleFiles = files.filter((file) => {
    const metadata = metadataFor(file.path);
    if (filter === 'review') return metadata?.reviewRequired;
    if (filter !== 'all') return (metadata?.status ?? 'draft') === filter;
    return true;
  });
  const formatLabels: Record<ContentFormat, string> = { post: 'X 单条', thread: 'Thread', reply: 'Reply', quote: 'Quote', other: '其他 Content' };
  const languageLabels: Record<ContentLanguage, string> = { en: '英文', zh: '中文', bilingual: '双语' };
  const statusLabel = (metadata?: ContentMetadata) => metadata?.reviewRequired ? '需要复核' : metadata?.status === 'published' ? '已发布' : metadata?.status === 'final' ? '定稿' : '草稿';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('lumiterra-content-working-draft') ?? '{}') as { selectedPath?: string; instruction?: string; temporaryContext?: string; format?: ContentFormat; language?: ContentLanguage; draft?: string; editing?: boolean; executionMode?: ExecutionMode; conversationInput?: string; knowledgePaths?: string[]; directionRun?: DirectionRun };
        const restoredFile = saved.selectedPath ? files.find((file) => file.path === saved.selectedPath) : undefined;
        const restoredMetadata = restoredFile ? metadataFor(restoredFile.path) : undefined;
        const restoreDurableVersion = restoredMetadata?.status === 'final' || restoredMetadata?.status === 'published';
        if (restoredFile) setSelectedPath(restoredFile.path);
        if (saved.instruction) setInstruction(saved.instruction);
        if (saved.temporaryContext) { setTemporaryContext(saved.temporaryContext); setContextOpen(true); }
        if (saved.format) setFormat(saved.format);
        if (saved.language) setLanguage(saved.language);
        if (restoreDurableVersion && restoredFile) setDraft(stripTitle(restoredFile.content));
        else if (saved.draft) setDraft(saved.draft);
        if (restoreDurableVersion) setEditing(false);
        else if (typeof saved.editing === 'boolean') setEditing(saved.editing);
        if (saved.executionMode) setExecutionMode(saved.executionMode);
        if (saved.conversationInput) setConversationInput(saved.conversationInput);
        if (Array.isArray(saved.knowledgePaths)) setKnowledgePaths(saved.knowledgePaths);
        if (saved.directionRun?.candidates?.length === 3) setDirectionRun(saved.directionRun);
      } catch {}
      setDraftRestored(true);
    }, 0);
    return () => window.clearTimeout(timer);
    // Restore the local working state once; saved files remain the durable content record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch('/api/content', { cache: 'no-store' })
      .then(async (response) => await response.json() as { configured?: boolean; model?: string })
      .then((result) => { setApiConfigured(Boolean(result.configured)); if (result.model) setApiModel(result.model); })
      .catch(() => setApiConfigured(false));
  }, []);

  useEffect(() => {
    if (!draftRestored) return;
    const timer = window.setTimeout(() => localStorage.setItem('lumiterra-content-working-draft', JSON.stringify({ selectedPath, instruction, temporaryContext, format, language, draft, editing, executionMode, conversationInput, knowledgePaths, directionRun })), 250);
    return () => window.clearTimeout(timer);
  }, [draftRestored, selectedPath, instruction, temporaryContext, format, language, draft, editing, executionMode, conversationInput, knowledgePaths, directionRun]);

  function resetContentWorkspace() {
    setSelectedPath(''); setInstruction(''); setTemporaryContext(''); setFormat('post'); setLanguage('en'); setDraft(''); setCodexRun(null); setConversationInput(''); setKnowledgePaths([]); setEditing(true); setContextOpen(false); setViewingVersionId(''); setDirectionRun(null); setFactCheck(null); setVersionHistoryOpen(false); setToneMenuOpen(false); setMoreMenuOpen(false); setFinalizePending(false);
  }

  function newContent() {
    if (hasTransientWork && !window.confirm('未保存的编辑会被放弃；已保存的草稿、定稿和历史版本仍会保留。是否开始新内容？')) return;
    resetContentWorkspace();
  }

  function cancelContentEdit() {
    if (directionRun) {
      setDirectionRun(null);
      setNotice({ tone: 'success', text: '已退出方向选择，原内容没有变化' });
      return;
    }
    const savedFile = files.find((file) => file.path === selectedPath);
    if (savedFile) {
      selectFile(savedFile);
      setNotice({ tone: 'success', text: '已放弃未保存修改，恢复到最近保存版本' });
      return;
    }
    resetContentWorkspace();
    setNotice({ tone: 'success', text: '已取消本次内容创作' });
  }

  function branchFromFinal() {
    setSelectedPath(''); setConversationInput(''); setEditing(true); setViewingVersionId(''); setFactCheck(null); setVersionHistoryOpen(false); setFinalizePending(false);
    setNotice({ tone: 'success', text: '已基于当前定稿创建新草稿，原定稿不会改变' });
  }

  function selectFile(file: WorkFile) {
    const metadata = metadataFor(file.path);
    setSelectedPath(file.path); setDraft(stripTitle(file.content)); setInstruction(metadata?.instruction ?? ''); setTemporaryContext(metadata?.temporaryContext ?? ''); setFormat(metadata?.format ?? 'post'); setLanguage(metadata?.language ?? 'en'); setCodexRun(null); setConversationInput(''); setKnowledgePaths(metadata?.knowledgePaths ?? []); setEditing(false); setContextOpen(Boolean(metadata?.temporaryContext)); setViewingVersionId(metadata?.versions?.at(-1)?.id ?? ''); setDirectionRun(null); setFactCheck(null); setVersionHistoryOpen(false); setToneMenuOpen(false); setMoreMenuOpen(false); setFinalizePending(false);
  }

  function viewVersion(version: ContentVersion) {
    setDraft(version.content);
    setViewingVersionId(version.id);
    setEditing(false);
    setDirectionRun(null);
    setFactCheck(null);
  }

  async function save(status: ContentStatus = 'draft', versionAction?: string) {
    if (!draft.trim()) return;
    setWorking(true);
    try {
      const result = await api<{ path: string; metadata: ContentMetadata }>({ action: 'saveContent', path: selectedPath || undefined, content: draft, instruction, temporaryContext, format, language, status, knowledgePaths, versionAction });
      setSelectedPath(result.path); setViewingVersionId(result.metadata.versions?.at(-1)?.id ?? ''); await refresh(true);
      if (status === 'final' || status === 'published') { setEditing(false); setFactCheck(null); setFinalizePending(false); setToneMenuOpen(false); setMoreMenuOpen(false); }
      setNotice({ tone: 'success', text: status === 'published' ? '已标记为发布内容，并进入内容记忆' : status === 'final' ? '已设为定稿，并进入内容记忆' : '草稿已保存' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '保存失败' }); }
    finally { setWorking(false); }
  }

  async function runContent(action = '继续精修当前版本', options: { format?: ContentFormat; mode?: ContentRunMode } = {}) {
    if (!instruction.trim() && !draft.trim()) return;
    setWorking(true); setCodexRun(null);
    const mode = options.mode ?? 'refine';
    const activeFormat = options.format ?? format;
    if (options.format) setFormat(options.format);
    const relatedPaths = relevantContentPaths(`${instruction}\n${temporaryContext}\n${draft}`, files, workspace.contentMetadata);
    const session = conversationState(selectedMetadata, executionMode, action, viewingHistoricalVersion);
    const canResume = mode === 'refine' && !session.restart && !viewingHistoricalVersion && selectedMetadata?.generator === executionMode;
    const outputRule = mode === 'explore'
      ? '这是方向探索。只返回 JSON：{"candidates":[{"label":"方向名","angle":"这一方向的核心判断与区别","content":"完整可发布正文"}]}。必须恰好三个真正不同的方向，不能只是近义改写。'
      : mode === 'fact_check'
      ? '这是定稿前事实检查。只返回 JSON：{"status":"pass 或 needs_changes","summary":"结论","issues":[{"severity":"high、medium 或 low","issue":"风险","basis":"产品依据"}],"correctedContent":"只修正事实风险后的完整正文"}。不要静默覆盖原文。'
      : '这是选定方向后的单线精修。只输出一个完整可发布版本，不解释；除非本次明确要求，不改变核心观点、叙事方向和有效表达。';
    const brief = `本次操作：${action}\n内容形式：${formatLabels[activeFormat]}\n输出语言：${languageLabels[language]}\n\n当前 Marketing 内容需求：\n${instruction || '基于当前草稿继续处理'}\n\n${temporaryContext ? `本次临时背景、热点或链接：\n${temporaryContext}\n\n` : ''}${selectedMetadata?.creativeDirection ? `当前已选创意方向：\n${selectedMetadata.creativeDirection}\n\n` : ''}${session.summary ? `前序创作已经确认的要求：\n${session.summary}\n\n` : ''}${relatedPaths.length ? `优先参考的已定稿或已发布内容：\n${relatedPaths.map((path) => `- ${path}`).join('\n')}\n\n` : '当前没有可用的定稿内容参考。\n\n'}${knowledgePaths.length ? `${knowledgeReferenceText(workspace, knowledgePaths)}\n\n` : ''}${draft ? `当前草稿：\n${draft}\n\n` : ''}执行要求：\n- 读取并以最新 sources/ 作为产品事实来源，知识库参考不能覆盖产品事实\n- 只把 data/content-metadata.json 中 final 或 published 且无需复核的内容作为表达记忆\n- 草稿不得作为官方表达依据\n- 区分已确认事实、运营表达和待确认信息\n- 不承诺未经确认的日期、数值、Token 收益或结果\n- 避免通用 Crypto 占位口号，表达必须具有 Lumiterra 的独特判断\n- ${outputRule}`;
    try {
      if (executionMode === 'api') {
        const response = await fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, action, instruction, temporaryContext, draft, format: activeFormat, language, relatedPaths, knowledgePaths, conversationSummary: session.summary, previousResponseId: canResume ? selectedMetadata?.apiResponseId : undefined }),
        });
        const result = await response.json() as { content?: string; candidates?: ContentCandidate[]; factCheck?: FactCheckResult; model?: string; responseId?: string; usage?: ApiUsage; error?: string };
        if (!response.ok) throw new Error(result.error || 'OpenAI API 内容生成失败');
        if (mode === 'explore') {
          if (result.candidates?.length !== 3) throw new Error('没有获得三个完整方向，请重试');
          setDirectionRun({ candidates: result.candidates, provider: 'api', createdAt: new Date().toISOString(), model: result.model || apiModel, responseId: result.responseId, usage: result.usage, turns: session.turns, summary: session.summary });
          setFactCheck(null); setNotice({ tone: 'success', text: '已生成三个方向，请选择一个继续' });
          return;
        }
        if (mode === 'fact_check') {
          if (!result.factCheck) throw new Error('没有获得事实检查结果，请重试');
          setFactCheck(result.factCheck); setNotice({ tone: 'success', text: result.factCheck.status === 'pass' ? '事实检查通过' : '发现需要确认或修正的内容' });
          return;
        }
        if (!result.content) throw new Error('OpenAI API 没有返回可用内容');
        const nextDraft = stripTitle(result.content);
        const saved = await api<{ path: string; metadata: ContentMetadata }>({
          action: 'saveContent', path: selectedMetadata?.status === 'draft' ? selectedPath : undefined, content: nextDraft, instruction, temporaryContext,
          format: activeFormat, language, status: 'draft', generator: 'api', model: result.model || apiModel, apiUsage: result.usage, apiResponseId: result.responseId,
          conversationTurns: session.turns, conversationSummary: session.summary, knowledgePaths, creativeDirection: selectedMetadata?.creativeDirection, versionAction: action,
        });
        setSelectedPath(saved.path); setDraft(nextDraft); setConversationInput(''); setEditing(false); setViewingVersionId(saved.metadata.versions?.at(-1)?.id ?? ''); setFactCheck(null);
        await refresh(true); setNotice({ tone: 'success', text: 'OpenAI API 已生成内容' });
        return;
      }

      if (mode === 'explore' || mode === 'fact_check') {
        const structuredRun = await executeCodex('', setCodexRun, undefined, undefined, 'text', brief);
        if (structuredRun.status === 'failed') throw new Error(structuredRun.error || 'Codex 内容任务未完成');
        const structured = parseJsonResponse<{ candidates?: Array<{ label?: string; angle?: string; content?: string }>; status?: string; summary?: string; issues?: FactCheckResult['issues']; correctedContent?: string }>(structuredRun.finalResponse ?? '');
        if (mode === 'explore') {
          const candidates = (structured.candidates ?? []).slice(0, 3).map((candidate, index) => ({ id: String.fromCharCode(65 + index), label: String(candidate.label ?? `方向 ${index + 1}`), angle: String(candidate.angle ?? ''), content: String(candidate.content ?? '').trim() })).filter((candidate) => candidate.content);
          if (candidates.length !== 3) throw new Error('Codex 没有返回三个完整方向，请重试');
          setDirectionRun({ candidates, provider: 'codex', createdAt: new Date().toISOString(), threadId: structuredRun.threadId, turns: session.turns, summary: session.summary });
          setFactCheck(null); setNotice({ tone: 'success', text: '已生成三个方向，请选择一个继续' });
        } else {
          const checked: FactCheckResult = { status: structured.status === 'pass' ? 'pass' : 'needs_changes', summary: String(structured.summary ?? ''), issues: Array.isArray(structured.issues) ? structured.issues : [], correctedContent: String(structured.correctedContent ?? draft) };
          setFactCheck(checked); setNotice({ tone: 'success', text: checked.status === 'pass' ? '事实检查通过' : '发现需要确认或修正的内容' });
        }
        return;
      }

      const resumeThreadId = canResume ? selectedMetadata?.codexThreadId : undefined;
      let run: CodexRun;
      let nextDraft = '';
      if (resumeThreadId) {
        run = await executeCodex('', setCodexRun, undefined, resumeThreadId, 'text', `${brief}\n\n延续当前内容创作会话，只在最终回复中输出修改后的正文，不要解释，不要创建文件。`);
        nextDraft = stripTitle(run.finalResponse ?? '');
      } else {
        run = await executeCodex('', setCodexRun, undefined, undefined, 'text', `${brief}\n\n这是新的内容分支，只在最终回复中输出修改后的正文，不要解释，不要创建文件。`);
        nextDraft = stripTitle(run.finalResponse ?? '');
      }
      if (run.status === 'failed') throw new Error(run.error || '内容任务未完成');
      if (!nextDraft) throw new Error('Codex 已完成，但没有返回可用内容');
      const saved = await api<{ path: string; metadata: ContentMetadata }>({
        action: 'saveContent', path: selectedMetadata?.status === 'draft' ? selectedPath : undefined, content: nextDraft, instruction, temporaryContext,
        format: activeFormat, language, status: 'draft', generator: 'codex', codexThreadId: run.threadId ?? resumeThreadId,
        conversationTurns: session.turns, conversationSummary: session.summary, knowledgePaths, creativeDirection: selectedMetadata?.creativeDirection, versionAction: action,
      });
      setSelectedPath(saved.path); setDraft(nextDraft); setConversationInput(''); setEditing(false); setViewingVersionId(saved.metadata.versions?.at(-1)?.id ?? '');
      await refresh(true); setNotice({ tone: 'success', text: 'Codex 已生成一个推荐版本' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '生成失败' }); }
    finally { setWorking(false); }
  }

  async function chooseDirection(candidate: ContentCandidate) {
    if (!directionRun) return;
    setWorking(true);
    try {
      const creativeDirection = `${candidate.label}｜${candidate.angle}`.slice(0, 800);
      const conversationSummary = [directionRun.summary, `用户已选择创意方向：${creativeDirection}`].filter(Boolean).join('\n').slice(-6_000);
      const saved = await api<{ path: string; metadata: ContentMetadata }>({
        action: 'saveContent', path: selectedMetadata?.status === 'draft' ? selectedPath : undefined, content: candidate.content, instruction, temporaryContext,
        format, language, status: 'draft', generator: directionRun.provider, model: directionRun.model, apiUsage: directionRun.usage,
        apiResponseId: directionRun.responseId, codexThreadId: directionRun.threadId, conversationTurns: directionRun.turns,
        conversationSummary, creativeDirection, knowledgePaths, versionAction: `选定方向：${candidate.label}`,
      });
      setSelectedPath(saved.path); setDraft(candidate.content); setConversationInput(''); setEditing(false); setViewingVersionId(saved.metadata.versions?.at(-1)?.id ?? ''); setDirectionRun(null); setFactCheck(null);
      await refresh(true); setNotice({ tone: 'success', text: `已选择“${candidate.label}”，现在可以围绕这个方向继续修改` });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '选择方向失败' }); }
    finally { setWorking(false); }
  }

  function loadFactCheckCorrection() {
    if (!factCheck?.correctedContent.trim()) return;
    setDraft(factCheck.correctedContent.trim()); setEditing(true); setFactCheck(null);
    setNotice({ tone: 'success', text: '修正版已放入编辑区，确认后保存即可' });
  }

  function beginFinalize() {
    setFinalizePending(true);
    void runContent('定稿前核对全部产品事实与公开表达风险', { mode: 'fact_check' });
  }

  function confirmFinalize() {
    if (factCheck?.status === 'needs_changes' && !window.confirm('检查仍发现需要处理的内容。确认仍将当前版本设为定稿吗？')) return;
    void save('final', '完成定稿检查并确认');
  }

  function createVisual() {
    if (!draft.trim()) return;
    sessionStorage.setItem('lumiterra-content-visual-brief', JSON.stringify({ content: draft, contentPath: selectedPath || '', linkContent: Boolean(selectedPath), knowledgePaths }));
    setView('assets'); setNotice({ tone: 'success', text: '当前内容已带入素材工作室' });
  }

  function openLinkedAsset(path: string) {
    sessionStorage.setItem('lumiterra-asset-open', path);
    setView('assets');
  }

  return <div className="page">
    <SectionTitle title="内容创作" action={<button className="primary" onClick={newContent} type="button">新建内容</button>} />
    <div className="content-workbench-layout">
      <aside className="box content-history"><BoxHeader title="内容记录" />
        <div className="content-history-filters">{([['all', '全部'], ['draft', '草稿'], ['final', '定稿'], ['published', '已发布'], ['review', '需复核']] as const).map(([key, label]) => <button className={filter === key ? 'active' : ''} onClick={() => setFilter(key)} key={key} type="button">{label}</button>)}</div>
        {visibleFiles.length === 0 && <Empty text="暂无内容记录" />}
        {visibleFiles.map((file) => { const metadata = metadataFor(file.path); return <button className={`content-history-row ${file.path === selectedPath ? 'active' : ''}`} onClick={() => selectFile(file)} key={file.path} type="button"><span className={metadata?.reviewRequired ? 'review' : ''}>{statusLabel(metadata)}</span><strong>{contentPreview(file.content)}</strong><small>{formatLabels[metadata?.format ?? 'post']} · {Math.max(1, metadata?.versions?.length ?? 0)} 版 · {formatTime(file.updatedAt)}</small></button>; })}
      </aside>

      <main className="content-workbench-main">
        {!isFinalized && <section className="box content-composer"><BoxHeader title="快速创作" />
          <div className="content-memory-strip"><span><i />最新产品内容 <strong>{formatTime(latestSourceUpdate)}</strong></span><span><i />定稿内容记忆 <strong>{approvedCount} 条</strong></span><span className="shared-memory-note">两种方式共用</span></div>
          <label className="content-request-label">现在想发什么？<textarea value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="例如：结合最近 Fully Onchain 的讨论，写一条更 Crypto Native 的 Lumiterra 推文。" /></label>
          <button className="content-context-toggle" onClick={() => setContextOpen(!contextOpen)} type="button" aria-expanded={contextOpen}><span>本次背景或热点（可选）</span><strong>{temporaryContext ? '已填写' : contextOpen ? '收起' : '添加'}</strong></button>
          {contextOpen && <label className="content-context-label">临时背景<textarea value={temporaryContext} onChange={(event) => setTemporaryContext(event.target.value)} placeholder="粘贴热点、推文链接、社区反馈或临时信息；只用于本次创作。" /></label>}
          <KnowledgeReferencePicker workspace={workspace} selected={knowledgePaths} onChange={setKnowledgePaths} query={`${instruction}\n${temporaryContext}\n${draft}`} />
          <div className="content-controls"><div className="execution-control"><span>执行方式</span><div className="execution-switch"><button className={executionMode === 'codex' ? 'active' : ''} onClick={() => setExecutionMode('codex')} type="button">Codex</button><button className={executionMode === 'api' ? 'active' : ''} onClick={() => setExecutionMode('api')} disabled={apiConfigured === false} title={apiConfigured === false ? '未配置 OPENAI_API_KEY' : apiModel} type="button">OpenAI API</button></div></div><label>形式<select value={format} onChange={(event) => setFormat(event.target.value as ContentFormat)}>{Object.entries(formatLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>语言<select value={language} onChange={(event) => setLanguage(event.target.value as ContentLanguage)}>{Object.entries(languageLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button className="primary" onClick={() => runContent(draft ? '基于当前版本重新探索三个创意方向' : '探索三个创意方向', { mode: 'explore' })} disabled={working || (!instruction.trim() && !draft.trim()) || (executionMode === 'api' && apiConfigured !== true)} type="button">{working ? '正在创作…' : draft ? '重新探索 3 个方向' : '生成 3 个方向'}</button></div>
          <CodexRunView run={codexRun} />
        </section>}

        <section className="box content-result">
          <BoxHeader title={directionRun ? '选择创作方向' : isFinalized ? '已完成内容' : '当前内容'} action={<div className="inline-actions">{hasUnsavedChanges && <span className="local-draft-status">本地未保存</span>}{selectedMetadata?.generator && <span className="provider-meta">{selectedMetadata.generator === 'api' ? selectedMetadata.model || 'OpenAI API' : 'Codex'}</span>}<span className={`content-status ${selectedMetadata?.reviewRequired ? 'review' : ''}`}>{statusLabel(selectedMetadata)}</span>{draft && !directionRun && !isFinalized && <button className="link-button" onClick={() => setEditing(!editing)} type="button">{editing ? '预览' : '编辑'}</button>}</div>} />

          {directionRun ? <section className="direction-board direction-board-focus">
            <div className="direction-board-head"><div><span>方向探索</span><strong>选定一个方向后，再进入编辑和多轮修改</strong></div><button onClick={cancelContentEdit} type="button">取消选择</button></div>
            <div className="direction-cards">{directionRun.candidates.map((candidate) => <article key={candidate.id}><header><span>{candidate.id}</span><div><strong>{candidate.label}</strong><p>{candidate.angle}</p></div></header><div className="direction-copy">{candidate.content}</div><button className="primary" onClick={() => chooseDirection(candidate)} disabled={working} type="button">选择这个方向</button></article>)}</div>
          </section> : <>
            {selectedMetadata?.creativeDirection && !isFinalized && <div className="selected-direction"><span>当前方向</span><strong>{selectedMetadata.creativeDirection}</strong><button onClick={() => runContent('基于当前版本重新探索三个创意方向', { mode: 'explore' })} disabled={working} type="button">换方向</button></div>}

            {contentVersions.length > 0 && <div className="content-version-compact">
              <button onClick={() => setVersionHistoryOpen(!versionHistoryOpen)} type="button"><span>{viewingHistoricalVersion ? `正在查看 V${activeVersionIndex + 1}` : `当前 V${contentVersions.length}`}</span><strong>{versionHistoryOpen ? '收起版本' : `查看全部 ${contentVersions.length} 个版本`}</strong></button>
              {versionHistoryOpen && <div className="content-version-bar"><div className="content-version-list">{contentVersions.map((version, index) => <button className={version.id === activeVersionId ? 'active' : ''} onClick={() => viewVersion(version)} title={version.action} type="button" key={version.id}><strong>V{index + 1}</strong><span>{version.action}</span><small>{formatTime(version.createdAt)}</small></button>)}</div>{viewingHistoricalVersion && <button className="restore-version" onClick={() => save('draft', `恢复到版本 V${activeVersionIndex + 1}`)} disabled={working} type="button">恢复为当前版本</button>}</div>}
            </div>}

            {editing && !isFinalized ? <textarea className="draft-editor fast-content-editor" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="也可以直接在这里写内容。" /> : format === 'post' || format === 'reply' || format === 'quote' ? <TwitterPreview title="" content={draft} /> : <div className="plain-content-preview">{draft || '暂无内容'}</div>}

            {isFinalized ? <div className="content-complete-state"><div><span>{selectedMetadata?.status === 'published' ? '已发布' : '已定稿 · 已进入内容记忆'}</span><strong>这条内容已退出编辑状态</strong></div><div><button onClick={branchFromFinal} type="button">基于此稿继续创作</button>{selectedMetadata?.status === 'final' && <button onClick={() => save('published')} disabled={working} type="button">标记已发布</button>}<button className="primary" onClick={newContent} type="button">开始下一条</button></div></div> : <>
              {draft && <div className="creation-conversation"><div className="conversation-head"><strong>围绕当前方向继续修改</strong><span>{contentTurns.length} 轮{selectedMetadata?.conversationSummary ? ' · 已整理前序要求' : ''}</span></div>{contentTurns.length > 0 && <details className="conversation-history-details"><summary>查看最近 {Math.min(4, contentTurns.length)} 轮调整</summary><div className="conversation-turns">{contentTurns.slice(-4).map((turn, index) => <div key={turn.id}><span>{turn.provider === 'api' ? 'API' : 'Codex'} · {Math.max(1, contentTurns.length - Math.min(4, contentTurns.length) + index + 1)}</span><p>{turn.instruction}</p></div>)}</div></details>}<div className="conversation-input"><input value={conversationInput} onChange={(event) => setConversationInput(event.target.value)} placeholder="说清楚：保留什么、只改什么、避免什么" onKeyDown={(event) => { if (event.key === 'Enter' && conversationInput.trim() && !working) void runContent(conversationInput); }} /><button className="primary" onClick={() => runContent(conversationInput)} disabled={!conversationInput.trim() || working || (executionMode === 'api' && apiConfigured !== true)} type="button">继续修改</button></div></div>}

              {draft && <div className="content-action-groups compact-actions">
                <div className="content-action-group"><span>快速精修</span><div><button onClick={() => runContent('只重写开头 Hook；保持核心观点、事实、语气方向和其余正文不变')} disabled={working} type="button">强化开头</button><button onClick={() => runContent('压缩正文；保持核心观点、情绪和创意方向不变，删除重复或弱信息')} disabled={working} type="button">压缩</button></div></div>
                <div className="content-action-menu"><button onClick={() => { setToneMenuOpen(!toneMenuOpen); setMoreMenuOpen(false); }} type="button">调整语气 <span>⌄</span></button>{toneMenuOpen && <div><button onClick={() => { setToneMenuOpen(false); void runContent('只调整措辞为更自然的 Crypto Native 表达；保持核心判断和内容结构不变'); }} disabled={working} type="button">Crypto Native</button><button onClick={() => { setToneMenuOpen(false); void runContent('只减少 AI 感和宣传腔；保持信息、结构与创意方向不变，像真实项目账号自然表达'); }} disabled={working} type="button">更自然</button><button onClick={() => { setToneMenuOpen(false); void runContent('增强神秘感和留白，但不能使用空泛占位口号；保持事实与核心观点不变'); }} disabled={working} type="button">更神秘</button><button onClick={() => { setToneMenuOpen(false); void runContent('增强观点冲突和回复欲望；不要制造虚假事实，保持当前创意方向不变'); }} disabled={working} type="button">更有冲突</button></div>}</div>
                <div className="content-action-menu"><button onClick={() => { setMoreMenuOpen(!moreMenuOpen); setToneMenuOpen(false); }} type="button">更多操作 <span>⌄</span></button>{moreMenuOpen && <div><button onClick={() => { setMoreMenuOpen(false); void runContent(language === 'zh' ? '翻译成自然的 Crypto 英文；保持观点、语气和结构' : '翻译成自然中文；保持观点、语气和结构'); }} disabled={working} type="button">翻译</button><button onClick={() => { setMoreMenuOpen(false); void runContent('改写成结构紧凑的 Twitter Thread；保持原核心观点', { format: 'thread' }); }} disabled={working} type="button">改成 Thread</button><button onClick={() => { setMoreMenuOpen(false); createVisual(); }} type="button">制作配图</button></div>}</div>
              </div>}

              {factCheck && <section className={`fact-check-panel ${factCheck.status}`}><header><div><span>{factCheck.status === 'pass' ? '检查通过' : '需要处理'}</span><strong>{factCheck.summary}</strong></div><button onClick={() => { setFactCheck(null); setFinalizePending(false); }} type="button">关闭</button></header>{factCheck.issues.length > 0 && <div className="fact-check-issues">{factCheck.issues.map((issue, index) => <article key={`${issue.issue}-${index}`}><span className={issue.severity}>{issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低'}</span><div><strong>{issue.issue}</strong><p>{issue.basis}</p></div></article>)}</div>}<footer><span>原文不会自动被覆盖</span><div>{factCheck.status === 'needs_changes' && <button onClick={loadFactCheckCorrection} disabled={!factCheck.correctedContent.trim()} type="button">载入修正版</button>}{finalizePending && <button className="primary" onClick={confirmFinalize} disabled={working} type="button">确认定稿</button>}</div></footer></section>}

              <div className="content-savebar"><span>{draft.trim().length} 字符{viewingHistoricalVersion ? ` · 基于 V${activeVersionIndex + 1}` : ''}</span><div><button onClick={cancelContentEdit} disabled={working} type="button">取消编辑</button><button onClick={() => save('draft')} disabled={!draft || working} type="button">保存草稿</button><button className="primary" onClick={beginFinalize} disabled={!draft || working} type="button">{working && finalizePending ? '正在检查…' : '检查并定稿'}</button></div></div>
            </>}

            {selectedMetadata?.generator === 'api' && selectedMetadata.apiUsage && <div className="api-usage">本次 API · 输入 {selectedMetadata.apiUsage.inputTokens.toLocaleString()} · 输出 {selectedMetadata.apiUsage.outputTokens.toLocaleString()}{selectedMetadata.apiUsage.cachedTokens ? ` · 缓存 ${selectedMetadata.apiUsage.cachedTokens.toLocaleString()}` : ''}</div>}
            {linkedAssets.length > 0 && <div className="linked-assets"><div><strong>关联配图</strong><span>{linkedAssets.length}</span></div><div>{linkedAssets.map(({ metadata, file }) => <button onClick={() => openLinkedAsset(file.path)} key={file.path} type="button"><Image src={`/api/file?path=${encodeURIComponent(file.path)}`} alt={metadata.title} width={180} height={120} unoptimized /><span>{metadata.title}</span></button>)}</div></div>}
          </>}
        </section>
      </main>
    </div>
  </div>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- retained temporarily while existing local drafts migrate to the new content memory model.
function ContentStudio({ workspace, refresh, setNotice }: { workspace: Workspace; refresh: (silent?: boolean) => Promise<void>; setNotice: (notice: Notice) => void }) {
  const files = workspace.outputs.filter((file) => file.path.startsWith('outputs/documents/') || file.path.startsWith('outputs/twitter/'));
  const [selectedPath, setSelectedPath] = useState('');
  const [category, setCategory] = useState<OutputCategory>('twitter');
  const [format, setFormat] = useState('Twitter 单条');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('Web3 游戏用户');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(true);
  const [working, setWorking] = useState(false);
  const [codexRun, setCodexRun] = useState<CodexRun | null>(null);
  const selected = files.find((file) => file.path === selectedPath);
  const twitterLength = draft.trim().length;

  function newContent() { setSelectedPath(''); setTitle(''); setGoal(''); setMessage(''); setDraft(''); setCodexRun(null); setEditing(true); }
  function selectFile(file: WorkFile) {
    setSelectedPath(file.path); setCategory(file.path.startsWith('outputs/twitter/') ? 'twitter' : 'documents');
    setTitle(displayName(file)); setDraft(stripTitle(file.content)); setCodexRun(null); setEditing(false);
  }
  async function saveDraft() {
    setWorking(true);
    try {
      const result = await api<{ path: string }>({ action: 'saveOutput', category, title, content: draft, path: selected?.path });
      setSelectedPath(result.path); await refresh(true); setNotice({ tone: 'success', text: '内容已保存' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '保存失败' }); }
    finally { setWorking(false); }
  }
  async function runCodex(action = '生成初稿') {
    setWorking(true);
    setCodexRun(null);
    const brief = `本次操作：${action}\n内容形式：${format}\n目标：${goal}\n目标用户：${audience}\n核心信息：${message}\n${selected ? `当前内容文件：${selected.path}\n` : ''}${draft ? `\n当前草稿：\n${draft}\n` : ''}\n请基于当前项目记忆执行，区分已确认事实和运营表达，并检查不应对外承诺的内容。`;
    try {
      const request = await api<{ path: string }>({ action: 'createRequest', kind: 'creation', outputType: category, title: title || `${format}创作`, brief });
      await refresh(true);
      const run = await executeCodex(request.path, setCodexRun);
      await refresh(true);
      if (run.status === 'failed') throw new Error(run.error || '内容任务未完成');
      const result = run.resultFiles.find((file) => file.path.startsWith(`outputs/${category}/`));
      if (result) {
        setSelectedPath(result.path);
        setTitle(result.name.replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-/, '').replaceAll('-', ' '));
        setDraft(stripTitle(result.content));
        setEditing(false);
      }
      setNotice({ tone: 'success', text: '内容已生成并保存' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '创建失败' }); }
    finally { setWorking(false); }
  }

  return <div className="page">
    <SectionTitle title="内容创作" action={<button className="primary" onClick={newContent} type="button">新建内容</button>} />
    <div className="studio-layout">
      <aside className="box item-list"><BoxHeader title="内容" />
        <div className="list-filter"><button className={category === 'twitter' ? 'active' : ''} onClick={() => { setCategory('twitter'); setSelectedPath(''); }} type="button">Twitter</button><button className={category === 'documents' ? 'active' : ''} onClick={() => { setCategory('documents'); setSelectedPath(''); }} type="button">运营文档</button></div>
        {files.filter((file) => file.path.startsWith(`outputs/${category}/`)).length === 0 && <Empty text="暂无内容" />}
        {files.filter((file) => file.path.startsWith(`outputs/${category}/`)).map((file) => <FileRow file={file} label="草稿" onClick={() => selectFile(file)} key={file.path} />)}
      </aside>

      <section className="box content-editor"><BoxHeader title={selected ? '当前内容' : '新建内容'} action={<div className="inline-actions"><span className="draft-status">草稿</span>{(selected || draft) && <button className="link-button" onClick={() => setEditing(!editing)} type="button">{editing ? '预览' : '编辑'}</button>}<button className="link-button" onClick={saveDraft} disabled={working || !title || !draft} type="button">保存</button></div>} />
        {!selected && <div className="brief-grid">
          <label>内容形式<select value={format} onChange={(event) => { setFormat(event.target.value); setCategory(event.target.value.includes('Twitter') ? 'twitter' : 'documents'); }}><option>Twitter 单条</option><option>Twitter Thread</option><option>核心叙事</option><option>产品介绍</option><option>FAQ</option><option>Timeline</option><option>活动方案</option></select></label>
          <label>目标用户<input value={audience} onChange={(event) => setAudience(event.target.value)} /></label>
          <label className="wide">内容标题<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="wide">创作目标<textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="希望用户看完后理解、相信或采取什么行动？" /></label>
          <label className="wide">核心信息<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="必须表达的事实、卖点或行动号召" /></label>
        </div>}
        {editing ? <>{selected && <input className="editor-title" value={title} onChange={(event) => setTitle(event.target.value)} aria-label="内容标题" />}<textarea className="draft-editor" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="在这里直接写，也可以让 Codex 生成初稿。" /></> : category === 'twitter' ? <TwitterPreview title={title} content={draft} /> : <MarkdownView content={`# ${title}\n\n${draft}`} className="content-document" />}
        <div className="editor-actions"><span>{category === 'twitter' ? `${twitterLength} 字符` : `${draft.length} 字`}</span><div><button className="primary" onClick={() => runCodex()} disabled={working || !title} type="button">{working ? '正在生成…' : draft ? '重新生成' : '生成初稿'}</button><button onClick={() => setDraft('')} type="button">清空</button></div></div>
      </section>

      <aside className="box context-panel"><BoxHeader title="AI 操作" />
        <div className="quick-tools"><button onClick={() => runCodex('生成初稿')} type="button"><strong>生成初稿</strong><small>根据目标和核心信息创作</small></button><button onClick={() => runCodex('生成三个不同方向')} type="button"><strong>三个方向</strong><small>比较不同 Hook 与叙事角度</small></button><button onClick={() => runCodex('缩短内容并增强开头 Hook')} disabled={!draft} type="button"><strong>缩短并增强</strong><small>让表达更适合公开发布</small></button><button onClick={() => runCodex('检查产品事实并标出依据')} disabled={!draft} type="button"><strong>事实检查</strong><small>核对产品文档与公开风险</small></button></div>
        <ContextList />
        <CodexRunView run={codexRun} />
      </aside>
    </div>
  </div>;
}

function TwitterPreview({ title, content }: { title: string; content: string }) {
  return <div className="twitter-preview-wrap"><div className="twitter-preview"><div className="twitter-avatar">L</div><div><div className="twitter-author"><strong>Lumiterra</strong><span>@LumiterraGame · now</span></div><p>{content || title || 'Twitter 内容预览'}</p><div className="twitter-actions"><span>Reply</span><span>Repost</span><span>Like</span><span>Share</span></div></div></div></div>;
}

function AssetStudio({ workspace, refresh, setNotice, active }: { workspace: Workspace; refresh: (silent?: boolean) => Promise<void>; setNotice: (notice: Notice) => void; active: boolean }) {
  const assets = workspace.outputs.filter((file) => file.path.startsWith('outputs/assets/'));
  const contentFiles = workspace.outputs.filter((file) => file.path.startsWith('outputs/twitter/'));
  const mediaAssets = assets.filter((file) => ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov'].includes(file.kind));
  const imageAssets = mediaAssets.filter((file) => ['png', 'jpg', 'jpeg', 'webp'].includes(file.kind));
  const metadataFor = (path: string) => workspace.assetMetadata.find((item) => item.path === path);
  const generatedAssets = imageAssets.filter((file) => metadataFor(file.path)?.source === 'generated');
  const referenceAssets = mediaAssets.filter((file) => metadataFor(file.path)?.source !== 'generated' || metadataFor(file.path)?.visualReference);
  const defaultReferencePaths = workspace.assetMetadata.filter((item) => item.defaultReference && imageAssets.some((file) => file.path === item.path)).map((item) => item.path);
  const [mode, setMode] = useState<'create' | 'references' | 'works'>('create');
  const [creationMode, setCreationMode] = useState<'new' | 'edit'>('new');
  const [creationSource, setCreationSource] = useState<AssetCreationSource>('independent');
  const [linkedContentPath, setLinkedContentPath] = useState('');
  const [linkContent, setLinkContent] = useState(false);
  const [seriesSelection, setSeriesSelection] = useState('new');
  const [seriesName, setSeriesName] = useState('');
  const [seriesRules, setSeriesRules] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [title, setTitle] = useState('');
  const [usage, setUsage] = useState('社交内容配图');
  const [message, setMessage] = useState('');
  const [format, setFormat] = useState('16:9');
  const [quality, setQuality] = useState('medium');
  const [requirements, setRequirements] = useState('');
  const [working, setWorking] = useState(false);
  const [codexRun, setCodexRun] = useState<CodexRun | null>(null);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [detailAssetPath, setDetailAssetPath] = useState('');
  const [references, setReferences] = useState<string[]>(defaultReferencePaths);
  const [knowledgePaths, setKnowledgePaths] = useState<string[]>([]);
  const [formRestored, setFormRestored] = useState(false);
  const [referencePickerOpen, setReferencePickerOpen] = useState(false);
  const [generationFailure, setGenerationFailure] = useState<ImageGenerationFailure | null>(null);
  const [imageConfigured, setImageConfigured] = useState<boolean | null>(null);
  const [imageModel, setImageModel] = useState('gpt-image-2');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('codex');
  const [referenceFilter, setReferenceFilter] = useState<'全部' | AssetRole>('全部');
  const [workFilter, setWorkFilter] = useState<'all' | 'draft' | 'adopted'>('all');
  const [assetIterationOpen, setAssetIterationOpen] = useState(false);
  const activeAsset = assets.find((file) => file.path === selectedAsset);
  const activeMetadata = metadataFor(selectedAsset);
  const assetCompleted = activeMetadata?.status === 'adopted' && !assetIterationOpen;
  const assetTurns = activeMetadata?.conversationTurns ?? [];
  const activeVersions = activeMetadata?.source === 'generated' ? generatedAssets
    .filter((file) => (metadataFor(file.path)?.groupId ?? metadataFor(file.path)?.title) === (activeMetadata.groupId ?? activeMetadata.title))
    .sort((a, b) => (metadataFor(a.path)?.version ?? 1) - (metadataFor(b.path)?.version ?? 1)) : [];
  const detailAsset = assets.find((file) => file.path === detailAssetPath);
  const detailMetadata = metadataFor(detailAssetPath);
  const selectedReferences = references.map((path) => imageAssets.find((file) => file.path === path)).filter((file): file is WorkFile => Boolean(file));
  const filteredReferences = referenceAssets.filter((file) => referenceFilter === '全部' || (metadataFor(file.path)?.role ?? '未分类') === referenceFilter);
  const workGroups = Array.from(generatedAssets.reduce<Map<string, WorkFile[]>>((groups, file) => {
    const metadata = metadataFor(file.path);
    if (workFilter !== 'all' && (metadata?.status ?? 'draft') !== workFilter) return groups;
    const key = metadata?.groupId ?? metadata?.title ?? file.name;
    groups.set(key, [...(groups.get(key) ?? []), file]);
    return groups;
  }, new Map()).values()).map((files) => files.sort((a, b) => (metadataFor(b.path)?.version ?? 1) - (metadataFor(a.path)?.version ?? 1)));
  const detailVersions = detailMetadata?.source === 'generated' ? generatedAssets.filter((file) => (metadataFor(file.path)?.groupId ?? metadataFor(file.path)?.title) === (detailMetadata.groupId ?? detailMetadata.title)).sort((a, b) => (metadataFor(b.path)?.version ?? 1) - (metadataFor(a.path)?.version ?? 1)) : [];
  const linkedBrief = detailMetadata?.briefPath ? workspace.outputs.find((file) => file.path === detailMetadata.briefPath) : workspace.outputs.find((file) => file.kind === 'md' && detailMetadata?.title && file.content?.toLowerCase().includes(detailMetadata.title.toLowerCase()));
  const linkedRecord = detailMetadata?.sessionPath ? workspace.records.find((file) => file.path === detailMetadata.sessionPath) : workspace.records.find((file) => detailMetadata?.title && file.content?.toLowerCase().includes(detailMetadata.title.toLowerCase()));
  const availableSeries = [...new Set(workspace.assetMetadata.map((item) => item.seriesName).filter((name): name is string => Boolean(name)))];
  const recentSeries = availableSeries.map((name) => ({ name, file: generatedAssets.filter((file) => metadataFor(file.path)?.seriesName === name).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] })).filter((item): item is { name: string; file: WorkFile } => Boolean(item.file)).sort((a, b) => b.file.updatedAt.localeCompare(a.file.updatedAt)).slice(0, 4);

  useEffect(() => { fetch('/api/image', { cache: 'no-store' }).then(async (response) => await response.json() as { configured?: boolean; model?: string }).then((result) => { setImageConfigured(Boolean(result.configured)); if (result.model) setImageModel(result.model); }).catch(() => setImageConfigured(false)); }, []);
  useEffect(() => {
    if (!active || formRestored) return;
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('lumiterra-asset-working-draft') ?? '{}') as { mode?: 'create' | 'references' | 'works'; creationMode?: 'new' | 'edit'; creationSource?: AssetCreationSource; linkedContentPath?: string; linkContent?: boolean; seriesSelection?: string; seriesName?: string; seriesRules?: string; adjustment?: string; title?: string; usage?: string; message?: string; format?: string; quality?: string; requirements?: string; selectedAsset?: string; references?: string[]; executionMode?: ExecutionMode; knowledgePaths?: string[]; assetIterationOpen?: boolean };
        if (saved.mode === 'create' || saved.mode === 'references' || saved.mode === 'works') setMode(saved.mode);
        if (saved.creationMode) setCreationMode(saved.creationMode);
        if (saved.creationSource) setCreationSource(saved.creationSource);
        if (typeof saved.linkedContentPath === 'string') setLinkedContentPath(saved.linkedContentPath);
        if (typeof saved.linkContent === 'boolean') setLinkContent(saved.linkContent);
        if (typeof saved.seriesSelection === 'string') setSeriesSelection(saved.seriesSelection);
        if (typeof saved.seriesName === 'string') setSeriesName(saved.seriesName);
        if (typeof saved.seriesRules === 'string') setSeriesRules(saved.seriesRules);
        if (typeof saved.adjustment === 'string') setAdjustment(saved.adjustment);
        if (typeof saved.title === 'string') setTitle(saved.title);
        if (typeof saved.usage === 'string') setUsage(normalizedAssetUsage(saved.usage));
        if (typeof saved.message === 'string') setMessage(saved.message);
        if (typeof saved.format === 'string') setFormat(saved.format);
        if (typeof saved.quality === 'string') setQuality(saved.quality);
        if (typeof saved.requirements === 'string') setRequirements(saved.requirements);
        if (saved.selectedAsset && assets.some((file) => file.path === saved.selectedAsset)) setSelectedAsset(saved.selectedAsset);
        if (Array.isArray(saved.references)) setReferences(saved.references.filter((path) => imageAssets.some((file) => file.path === path)));
        if (saved.executionMode) setExecutionMode(saved.executionMode);
        if (Array.isArray(saved.knowledgePaths)) setKnowledgePaths(saved.knowledgePaths);
        if (typeof saved.assetIterationOpen === 'boolean') setAssetIterationOpen(saved.assetIterationOpen);
        const savedFailure = localStorage.getItem('lumiterra-asset-generation-failure');
        if (savedFailure) setGenerationFailure(JSON.parse(savedFailure) as ImageGenerationFailure);
      } catch {}
      setFormRestored(true);
    }, 0);
    return () => window.clearTimeout(timer);
    // Restore when the always-mounted studio first becomes visible; generated files remain the durable asset record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, formRestored]);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      const contentDraft = sessionStorage.getItem('lumiterra-content-visual-brief');
      const assetToOpen = sessionStorage.getItem('lumiterra-asset-open');
      if (contentDraft) {
        try {
          const parsed = JSON.parse(contentDraft) as { content?: string; contentPath?: string; linkContent?: boolean; knowledgePaths?: string[] };
          setCreationSource('content'); setUsage('社交内容配图'); setTitle('内容配图'); setMessage(parsed.content ?? ''); setLinkedContentPath(parsed.contentPath ?? ''); setLinkContent(Boolean(parsed.linkContent && parsed.contentPath)); setKnowledgePaths(parsed.knowledgePaths ?? []);
        } catch {
          setCreationSource('content'); setUsage('社交内容配图'); setTitle('内容配图'); setMessage(contentDraft);
        }
        sessionStorage.removeItem('lumiterra-content-visual-brief');
      }
      if (assetToOpen) {
        const metadata = metadataFor(assetToOpen);
        setSelectedAsset(assetToOpen); setReferences([assetToOpen]); setCreationMode('edit');
        setCreationSource(metadata?.creationSource ?? 'independent'); setTitle(metadata?.title ?? ''); setUsage(normalizedAssetUsage(metadata?.usage)); setRequirements(metadata?.prompt ?? '');
        setLinkedContentPath(metadata?.linkedContentPaths?.[0] ?? ''); setLinkContent(Boolean(metadata?.linkedContentPaths?.length));
        setSeriesName(metadata?.seriesName ?? ''); setSeriesRules(metadata?.seriesRules ?? ''); setSeriesSelection(metadata?.seriesName ?? 'new');
        setKnowledgePaths(metadata?.knowledgePaths ?? []);
        sessionStorage.removeItem('lumiterra-asset-open');
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // Consume a handoff whenever the already-mounted studio becomes active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    if (!formRestored) return;
      const timer = window.setTimeout(() => localStorage.setItem('lumiterra-asset-working-draft', JSON.stringify({ mode, creationMode, creationSource, linkedContentPath, linkContent, seriesSelection, seriesName, seriesRules, adjustment, title, usage, message, format, quality, requirements, selectedAsset, references, executionMode, knowledgePaths, assetIterationOpen })), 250);
    return () => window.clearTimeout(timer);
  }, [formRestored, mode, creationMode, creationSource, linkedContentPath, linkContent, seriesSelection, seriesName, seriesRules, adjustment, title, usage, message, format, quality, requirements, selectedAsset, references, executionMode, knowledgePaths, assetIterationOpen]);

  function briefText(adjustmentText = '') {
    const sourceLabel = creationSource === 'content' ? '基于内容制作' : creationSource === 'series' ? '系列创作' : '独立制作';
    return `素材类型：图片\n创作来源：${sourceLabel}\n用途：${usage}\n画面目标：${message}\n规格：${format}\n${creationSource === 'series' ? `系列名称：${seriesName}\n系列视觉规则：${seriesRules || '沿用已确认作品与参考素材'}\n` : ''}${adjustmentText ? `本轮调整：${adjustmentText}\n` : ''}补充要求：${requirements || '无'}\n参考素材：${references.join('、') || '无'}\n内容关联：${creationSource === 'content' && linkContent && linkedContentPath ? linkedContentPath : '无'}${knowledgePaths.length ? `\n\n${knowledgeReferenceText(workspace, knowledgePaths)}\n\n使用规则：知识库只提供运营背景，最新 sources/ 仍是产品事实来源。` : ''}`;
  }

  function savedPromptField(prompt: string | undefined, label: string) {
    const prefix = `${label}：`;
    return prompt?.split('\n').find((line) => line.startsWith(prefix))?.slice(prefix.length).trim();
  }

  function confirmCreationSwitch(prompt: string) {
    const hasCurrentWork = Boolean(selectedAsset || title.trim() || message.trim() || requirements.trim());
    return !hasCurrentWork || window.confirm(prompt);
  }

  function clearAssetWorkspace() {
    setMode('create'); setCreationMode('new'); setCreationSource('independent'); setSelectedAsset(''); setDetailAssetPath('');
    setTitle(''); setUsage('社交内容配图'); setMessage(''); setFormat('16:9'); setQuality('medium'); setRequirements(''); setAdjustment(''); setReferences(defaultReferencePaths); setKnowledgePaths([]);
    setLinkedContentPath(''); setLinkContent(false); setSeriesSelection('new'); setSeriesName(''); setSeriesRules(''); setAssetIterationOpen(false);
    setCodexRun(null); setGenerationFailure(null); localStorage.removeItem('lumiterra-asset-generation-failure');
  }

  function startNewCreation() {
    if (!confirmCreationSwitch('当前创作和已生成版本会保留在“生成作品”中。是否开始新创作？')) return;
    clearAssetWorkspace();
  }

  function cancelAssetCreation() {
    if (working) return;
    if (activeAsset) {
      continueWith(activeAsset);
      setAssetIterationOpen(false);
      setNotice({ tone: 'success', text: '已放弃未保存调整，生成作品和历史版本仍保留' });
      return;
    }
    clearAssetWorkspace();
    setNotice({ tone: 'success', text: '已取消本次图片制作' });
  }

  function chooseCreationSource(next: AssetCreationSource) {
    if (next === creationSource) return;
    if (selectedAsset && !confirmCreationSwitch('当前创作和已生成版本会保留在“生成作品”中。是否切换创作方式？')) return;
    setCreationSource(next); setAdjustment('');
    setSelectedAsset(''); setReferences(defaultReferencePaths); setCreationMode('new');
    if (next === 'independent') { setLinkedContentPath(''); setLinkContent(false); }
    if (next === 'content') { setUsage('社交内容配图'); setLinkContent(Boolean(linkedContentPath)); }
    if (next === 'series') { setLinkContent(false); setLinkedContentPath(''); }
  }

  function chooseContent(path: string) {
    setLinkedContentPath(path); setLinkContent(Boolean(path));
    const file = contentFiles.find((item) => item.path === path);
    if (file) { setMessage(stripTitle(file.content)); setKnowledgePaths(workspace.contentMetadata.find((item) => item.path === path)?.knowledgePaths ?? []); if (!title) setTitle('内容配图'); }
  }

  function chooseSeries(value: string) {
    if (value === seriesSelection) return;
    const nextLatest = value === 'new' ? undefined : generatedAssets.filter((file) => metadataFor(file.path)?.seriesName === value).sort((a, b) => (metadataFor(b.path)?.version ?? 1) - (metadataFor(a.path)?.version ?? 1))[0];
    if ((selectedAsset && nextLatest?.path !== selectedAsset) && !confirmCreationSwitch(value === 'new' ? '当前创作和已生成版本会保留在“生成作品”中。是否新建连续创作？' : '当前创作和已生成版本会保留在“生成作品”中。是否载入另一组连续创作？')) return;
    setSeriesSelection(value); setAdjustment('');
    if (value === 'new') { setSeriesName(''); setSeriesRules(''); setSelectedAsset(''); setReferences(defaultReferencePaths); setCreationMode('new'); return; }
    const latest = nextLatest;
    const metadata = latest ? metadataFor(latest.path) : undefined;
    setSeriesName(value); setSeriesRules(metadata?.seriesRules ?? '');
    if (latest) { setSelectedAsset(latest.path); setReferences([latest.path]); setCreationMode('edit'); setTitle(metadata?.title ?? value); setUsage(normalizedAssetUsage(metadata?.usage)); setRequirements(''); setKnowledgePaths(metadata?.knowledgePaths ?? []); }
  }

  async function saveBrief() {
    setWorking(true);
    try { const result = await api<{ path: string }>({ action: 'saveOutput', category: 'assets', title, content: briefText() }); if (knowledgePaths.length) await api({ action: 'recordKnowledgeUsage', knowledgePaths, targetPath: result.path }); await refresh(true); setNotice({ tone: 'success', text: '创作要求已保存' }); }
    catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '保存失败' }); }
    finally { setWorking(false); }
  }

  async function runCodexBrief() {
    setWorking(true); setCodexRun(null);
    try {
      const request = await api<{ path: string }>({ action: 'createRequest', kind: 'creation', outputType: 'assets', title: `${title || '图片素材'}创意方案`, brief: `${briefText()}\n\n本次只完善创意方案，不生成图片。请写出可继续编辑的画面方案与提示词，包括主体、环境、构图、氛围、色彩、关键细节和避免事项。` });
      const run = await executeCodex(request.path, setCodexRun);
      if (run.status === 'failed') throw new Error(run.error || '创意方案未完成');
      const result = run.resultFiles.find((file) => file.path.startsWith('outputs/assets/') && ['md', 'txt'].includes(file.path.split('.').pop() ?? ''));
      if (result?.content) setRequirements(stripTitle(result.content));
      await refresh(true); setNotice({ tone: 'success', text: '创意方案已生成' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '创建失败' }); }
    finally { setWorking(false); }
  }

  async function runCodexImage(adjustmentText = '') {
    setWorking(true); setCodexRun(null); setGenerationFailure(null); localStorage.removeItem('lumiterra-asset-generation-failure');
    try {
      const parentPath = creationMode === 'edit' ? selectedAsset : '';
      const parentMetadata = parentPath ? metadataFor(parentPath) : undefined;
      const turnInstruction = adjustmentText.trim() || (parentPath ? '基于当前结果再生成一版' : `首次生成：${message}`);
      const session = conversationState(parentMetadata, 'codex', turnInstruction);
      const resumeThreadId = session.restart ? undefined : parentMetadata?.threadId;
      const linkedContentPaths = creationSource === 'content' && linkContent && linkedContentPath ? [linkedContentPath] : [];
      const activeSeriesName = creationSource === 'series' ? seriesName.trim() : '';
      const activeBrief = `${briefText(adjustmentText)}${session.summary ? `\n前序创作已经确认的要求：\n${session.summary}` : ''}`;
      let displayedPath = '';
      let requestPath = '';
      let directPrompt = '';
      if (resumeThreadId) {
        directPrompt = `${activeBrief}\n\n延续当前会话已经确认的视觉语言，并以本轮要求和参考图片为准。只生成一个新图片版本。`;
      } else {
        const request = await api<{ path: string }>({
          action: 'createRequest', kind: 'creation', outputType: 'assets', title: title || 'Lumiterra V2 图片',
          brief: `${activeBrief}\n\n创作动作：直接生成图片。请先读取参考图片路径并查看其视觉内容，再调用当前 Codex 可用的 ImageGen 图像能力完成生成。将最终图片以 PNG 保存到 outputs/assets/；同时保存一份简短创作说明并按 AGENTS.md 写执行记录。保持 Lumiterra 官方角色、Logo 与既有视觉的一致性，不确定的品牌元素不要自行重绘。`,
        });
        requestPath = request.path;
      }
      const revealImage = async (progress: CodexRun) => {
        const image = progress.resultFiles.find((file) => /\.(png|jpe?g|webp)$/i.test(file.path));
        if (!image || displayedPath === image.path) return;
        displayedPath = image.path;
        try {
          await api({ action: 'registerGeneratedAsset', path: image.path, title, usage, prompt: activeBrief, references, parentPath, generator: 'codex', creationSource, linkedContentPaths, seriesName: activeSeriesName, seriesRules: activeSeriesName ? seriesRules : '', threadId: progress.threadId ?? resumeThreadId, conversationTurns: session.turns, conversationSummary: session.summary, knowledgePaths });
          setSelectedAsset(image.path); setCreationMode('edit'); setReferences([image.path]); setAssetIterationOpen(false);
          await refresh(true); setNotice({ tone: 'success', text: '图片已生成并显示，Codex 正在保存记录' });
        } catch (error) {
          setNotice({ tone: 'error', text: error instanceof Error ? error.message : '图片已生成，但登记失败' });
        }
      };
      const run = await executeCodex(requestPath, setCodexRun, revealImage, resumeThreadId, 'image', directPrompt || undefined);
      if (run.status === 'failed') throw new Error(run.error || '图片生成未完成');
      const result = run.resultFiles.find((file) => /\.(png|jpe?g|webp)$/i.test(file.path));
      if (!result) throw new Error('Codex 已完成任务，但没有检测到新图片');
      const brief = run.resultFiles.find((file) => file.path.startsWith('outputs/assets/') && /\.(md|txt)$/i.test(file.path));
      await api({ action: 'registerGeneratedAsset', path: result.path, title, usage, prompt: activeBrief, references, parentPath, generator: 'codex', briefPath: brief?.path, creationSource, linkedContentPaths, seriesName: activeSeriesName, seriesRules: activeSeriesName ? seriesRules : '', threadId: run.threadId ?? resumeThreadId, conversationTurns: session.turns, conversationSummary: session.summary, knowledgePaths });
      setSelectedAsset(result.path); setCreationMode('edit'); setReferences([result.path]); setAssetIterationOpen(false);
      setAdjustment('');
      await refresh(true); setNotice({ tone: 'success', text: 'Codex 已生成图片并保存到生成作品' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '图片生成失败' }); }
    finally { setWorking(false); }
  }

  async function generateImageWithApi(adjustmentText = '') {
    setWorking(true); setCodexRun(null); setGenerationFailure(null); localStorage.removeItem('lumiterra-asset-generation-failure');
    try {
      const parentPath = creationMode === 'edit' ? selectedAsset : '';
      const parentMetadata = parentPath ? metadataFor(parentPath) : undefined;
      const turnInstruction = adjustmentText.trim() || (parentPath ? '基于当前结果再生成一版' : `首次生成：${message}`);
      const session = conversationState(parentMetadata, 'api', turnInstruction);
      const canResume = !session.restart && parentMetadata?.generator === 'api';
      const prompt = `${briefText(adjustmentText)}\n\n${references.length ? '请使用所附参考图片中的角色、世界观、配色或构图信息；' : ''}保持官方视觉一致，不要伪造或自行重绘不确定的 Logo。只生成一个图片版本。`;
      const linkedContentPaths = creationSource === 'content' && linkContent && linkedContentPath ? [linkedContentPath] : [];
      const response = await fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, prompt, usage, ratio: format, quality, references, parentPath, creationSource, linkedContentPaths, seriesName: creationSource === 'series' ? seriesName : '', seriesRules: creationSource === 'series' ? seriesRules : '', threadId: parentMetadata?.threadId, conversationMode: Boolean(parentPath), previousResponseId: canResume ? parentMetadata?.apiResponseId : undefined, conversationTurns: session.turns, conversationSummary: session.summary, knowledgePaths }) });
      const result = await response.json() as { path?: string; responseId?: string; error?: string; code?: string; requestId?: string };
      if (!response.ok || !result.path) {
        const failure = { message: result.error || 'API 图片生成失败', code: result.code, requestId: result.requestId, failedAt: new Date().toISOString() };
        setGenerationFailure(failure); localStorage.setItem('lumiterra-asset-generation-failure', JSON.stringify(failure));
        throw new Error(failure.message);
      }
      setSelectedAsset(result.path); setCreationMode('edit'); setReferences([result.path]); setAssetIterationOpen(false);
      setAdjustment('');
      await refresh(true); setNotice({ tone: 'success', text: 'API 已生成图片并保存到生成作品' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '图片生成失败' }); }
    finally { setWorking(false); }
  }

  function runImage(adjustmentText = '') {
    if (executionMode === 'api') return generateImageWithApi(adjustmentText);
    return runCodexImage(adjustmentText);
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const pickedFiles = Array.from(event.target.files ?? []).slice(0, 20); if (!pickedFiles.length) return;
    setWorking(true);
    setNotice({ tone: 'success', text: `正在上传 ${pickedFiles.length} 个素材…` });
    const uploadedPaths: string[] = [];
    const failedNames: string[] = [];
    let successCount = 0;
    try {
      for (const file of pickedFiles) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('读取素材失败')); reader.readAsDataURL(file); });
          const result = await api<{ path: string }>({ action: 'uploadAsset', title: file.name.replace(/\.[^.]+$/, ''), mimeType: file.type, data: dataUrl.split(',')[1] ?? '' });
          successCount += 1;
          if (file.type.startsWith('image/')) uploadedPaths.push(result.path);
        } catch { failedNames.push(file.name); }
      }
      if (uploadedPaths.length) setReferences((current) => [...new Set([...current, ...uploadedPaths])]);
      await refresh(true);
      if (!successCount && failedNames.length) throw new Error(`${failedNames.length} 个素材上传失败，请检查格式或文件大小`);
      setNotice({ tone: 'success', text: `已上传 ${successCount} 个素材${uploadedPaths.length ? `；${uploadedPaths.length} 张图片已加入本次参考` : ''}${failedNames.length ? `，${failedNames.length} 个失败` : ''}` });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '上传失败' }); }
    finally { setWorking(false); event.target.value = ''; }
  }

  function toggleReference(path: string) {
    setReferences((current) => current.includes(path) ? current.filter((item) => item !== path) : [...current, path]);
  }

  async function updateMetadata(path: string, changes: { role?: AssetRole; status?: 'draft' | 'adopted'; visualReference?: boolean; defaultReference?: boolean }) {
    try { await api({ action: 'updateAssetMetadata', path, ...changes }); await refresh(true); return true; }
    catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '更新失败' }); return false; }
  }

  async function adoptCurrentAsset() {
    if (!activeAsset) return;
    if (!await updateMetadata(activeAsset.path, { status: 'adopted' })) return;
    setAssetIterationOpen(false);
    setNotice({ tone: 'success', text: '已采用这个版本，并退出当前编辑状态' });
  }

  function continueWith(file: WorkFile) {
    if (file.path !== selectedAsset && !confirmCreationSwitch('当前创作和已生成版本会保留在“生成作品”中。是否载入这项创作？')) return;
    const metadata = metadataFor(file.path);
    setSelectedAsset(file.path); setReferences([file.path]); setCreationMode('edit'); setMode('create'); setDetailAssetPath('');
    setTitle(metadata?.title ?? displayName(file));
    if (metadata?.usage) setUsage(normalizedAssetUsage(metadata.usage));
    setMessage(savedPromptField(metadata?.prompt, '画面目标') ?? '');
    const savedRequirements = savedPromptField(metadata?.prompt, '补充要求');
    setRequirements(savedRequirements === '无' ? '' : savedRequirements ?? '');
    const savedFormat = savedPromptField(metadata?.prompt, '规格');
    if (savedFormat) setFormat(savedFormat);
    const source = metadata?.creationSource ?? (metadata?.seriesName ? 'series' : metadata?.linkedContentPaths?.length ? 'content' : 'independent');
    setCreationSource(source); setLinkedContentPath(metadata?.linkedContentPaths?.[0] ?? ''); setLinkContent(Boolean(metadata?.linkedContentPaths?.length));
    setSeriesName(metadata?.seriesName ?? ''); setSeriesRules(metadata?.seriesRules ?? ''); setSeriesSelection(metadata?.seriesName ?? 'new'); setAdjustment('');
    setKnowledgePaths(metadata?.knowledgePaths ?? []);
    setAssetIterationOpen(true);
  }

  function selectVersion(file: WorkFile) {
    setSelectedAsset(file.path); setCreationMode('edit'); setReferences([file.path]); setAdjustment(''); setKnowledgePaths(metadataFor(file.path)?.knowledgePaths ?? []); setAssetIterationOpen(false);
  }

  return <div className="page">
    <SectionTitle title="素材工作室" action={<div className="library-actions"><button onClick={startNewCreation} type="button">新建创作</button><label className="upload-button">批量上传<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={upload} multiple hidden /></label></div>} />
    <div className="workspace-tabs asset-tabs"><button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')} type="button">图片制作</button><button className={mode === 'references' ? 'active' : ''} onClick={() => setMode('references')} type="button">参考素材 <span>{referenceAssets.length}</span></button><button className={mode === 'works' ? 'active' : ''} onClick={() => setMode('works')} type="button">生成作品 <span>{workGroups.length}</span></button></div>

    {mode === 'create' && <div className="asset-create-layout">
      <section className="box asset-form"><BoxHeader title={assetCompleted ? '已采用作品' : creationMode === 'edit' ? '继续制作' : '图片制作'} action={<button className="link-button" onClick={cancelAssetCreation} disabled={working} type="button">取消本次制作</button>} />
        <div className="creation-source-switch"><button className={creationSource === 'independent' ? 'active' : ''} onClick={() => chooseCreationSource('independent')} type="button"><strong>独立制作</strong><span>从零开始或使用参考</span></button><button className={creationSource === 'content' ? 'active' : ''} onClick={() => chooseCreationSource('content')} type="button"><strong>从内容制作</strong><span>使用现有内容作为输入</span></button><button className={creationSource === 'series' ? 'active' : ''} onClick={() => chooseCreationSource('series')} type="button"><strong>连续创作</strong><span>延续已有视觉继续迭代</span></button></div>
        <div className="asset-execution-row"><span>执行方式</span><div className="execution-switch"><button className={executionMode === 'codex' ? 'active' : ''} onClick={() => setExecutionMode('codex')} type="button">Codex ImageGen</button><button className={executionMode === 'api' ? 'active' : ''} onClick={() => setExecutionMode('api')} disabled={imageConfigured === false} title={imageConfigured === false ? '未配置 OPENAI_API_KEY' : imageModel} type="button">OpenAI API</button></div><small>{executionMode === 'api' ? imageModel : '当前 Codex 会话'}</small></div>
        {creationSource === 'content' && <div className="creation-context-block"><label>选择内容<select value={linkedContentPath} onChange={(event) => chooseContent(event.target.value)}><option value="">{message ? '当前带入内容' : '选择一条已有内容'}</option>{contentFiles.map((file) => <option value={file.path} key={file.path}>{contentPreview(file.content)}</option>)}</select></label><label className="optional-link"><input type="checkbox" checked={linkContent} disabled={!linkedContentPath} onChange={(event) => setLinkContent(event.target.checked)} /><span>生成后关联到这条内容</span></label></div>}
        {creationSource === 'series' && <div className="creation-context-block series-context"><label>选择连续创作<select value={seriesSelection} onChange={(event) => chooseSeries(event.target.value)}><option value="new">新建连续创作</option>{availableSeries.map((name) => <option value={name} key={name}>{name}</option>)}</select></label><label>创作名称<input value={seriesName} onChange={(event) => setSeriesName(event.target.value)} disabled={seriesSelection !== 'new'} placeholder="给这组连续作品命名" /></label>{recentSeries.length > 0 && <div className="wide recent-series"><span>最近使用</span><div>{recentSeries.map((item) => <button className={seriesSelection === item.name ? 'active' : ''} onClick={() => chooseSeries(item.name)} type="button" key={item.name}><Image src={`/api/file?path=${encodeURIComponent(item.file.path)}`} alt={item.name} width={120} height={80} unoptimized /><strong>{item.name}</strong></button>)}</div></div>}<label className="wide">持续保持的视觉要素<textarea value={seriesRules} onChange={(event) => setSeriesRules(event.target.value)} placeholder="角色、Logo、配色、构图、排版或其他需要延续的要素" /></label></div>}
        <div className="asset-form-grid"><label>作品名称<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="给当前作品命名" /></label><label>用途<select value={usage} onChange={(event) => setUsage(event.target.value)}><option>社交内容配图</option><option>Campaign 视觉</option><option>Key Visual</option><option>产品说明</option><option>社区互动</option><option>产品演示</option><option>其他</option></select></label></div>
        <label>画面目标<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="这张图第一眼要传达什么？" /></label>
        <div className="asset-options"><label>比例<select value={format} onChange={(event) => setFormat(event.target.value)}><option>1:1</option><option>16:9</option><option>4:5</option><option>9:16</option></select></label><label>精细度<select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="low">快速</option><option value="medium">标准</option><option value="high">精细</option></select></label></div>
        <label>补充要求<textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="角色、场景、构图、氛围、配色、需要避免的内容" /></label>
        <KnowledgeReferencePicker workspace={workspace} selected={knowledgePaths} onChange={setKnowledgePaths} query={`${title}\n${message}\n${requirements}`} />
        <div className="selected-reference-block"><div><strong>本次参考</strong><span>已选 {references.length} 张</span><button onClick={() => setReferencePickerOpen(true)} type="button">选择参考</button></div>{selectedReferences.length ? <div className="selected-reference-row">{selectedReferences.map((file) => <button onClick={() => toggleReference(file.path)} key={file.path} title="移除参考" type="button"><Image src={`/api/file?path=${encodeURIComponent(file.path)}`} alt={displayName(file)} width={160} height={110} unoptimized /><span>×</span></button>)}</div> : <p>未选择参考图片</p>}</div>
        <div className="form-actions asset-primary-actions"><button className="primary" onClick={() => runImage()} disabled={working || assetCompleted || !title || !message || (creationSource === 'series' && !seriesName.trim()) || (executionMode === 'api' && imageConfigured !== true)} type="button">{working ? '正在生成…' : creationMode === 'edit' ? '按当前设置生成' : executionMode === 'api' ? '使用 API 生成' : '使用 Codex 生成'}</button><button onClick={runCodexBrief} disabled={working || assetCompleted || !title} type="button">Codex 生成方案</button><button onClick={saveBrief} disabled={working || assetCompleted || !title} type="button">保存创作要求</button></div>
        <CodexRunView run={codexRun} />
      </section>
      <aside className="box generation-result">
        <BoxHeader title={assetCompleted ? '已采用版本' : '当前结果'} />
        {working && <div className="generation-status"><strong>正在生成图片</strong><span>使用 {executionMode === 'api' ? imageModel : 'Codex ImageGen'} · {references.length} 张参考</span><p>复杂图片可能需要约 2 分钟，完成后会自动显示。</p></div>}
        {generationFailure && <div className="generation-failure"><div><strong>生成未完成</strong><button onClick={() => { setGenerationFailure(null); localStorage.removeItem('lumiterra-asset-generation-failure'); }} type="button">清除</button></div><p>{generationFailure.message}</p>{(generationFailure.code || generationFailure.requestId) && <span>{generationFailure.code ? `错误码：${generationFailure.code}` : ''}{generationFailure.code && generationFailure.requestId ? ' · ' : ''}{generationFailure.requestId ? `请求编号：${generationFailure.requestId}` : ''}</span>}</div>}
        {activeAsset && ['png', 'jpg', 'jpeg', 'webp'].includes(activeAsset.kind) ? <>
          <div className="generated-preview"><Image src={`/api/file?path=${encodeURIComponent(activeAsset.path)}`} alt={activeMetadata?.title ?? displayName(activeAsset)} width={900} height={900} unoptimized /></div>
          <div className="result-meta"><div><strong>{activeMetadata?.title ?? displayName(activeAsset)}</strong><span>{activeMetadata?.seriesName ? `${activeMetadata.seriesName} · ` : ''}{activeMetadata?.generator === 'api' ? activeMetadata.apiResponseId ? 'OpenAI API 多轮' : 'OpenAI API' : 'Codex ImageGen'}{activeMetadata?.version ? ` · V${activeMetadata.version}` : ''}</span></div><span className={`status-badge ${activeMetadata?.status === 'adopted' ? 'adopted' : ''}`}>{activeMetadata?.status === 'adopted' ? '已采用' : '草稿'}</span></div>
          {activeVersions.length > 1 && <section className="current-version-section"><div><strong>版本记录</strong><span>{activeVersions.length} 个版本 · 点击查看</span></div><div className="current-version-strip">{activeVersions.map((file) => { const metadata = metadataFor(file.path); return <button className={file.path === activeAsset.path ? 'active' : ''} onClick={() => selectVersion(file)} aria-current={file.path === activeAsset.path ? 'true' : undefined} title={`查看 V${metadata?.version ?? 1}`} type="button" key={file.path}><Image src={`/api/file?path=${encodeURIComponent(file.path)}`} alt={`${metadata?.title ?? displayName(file)} V${metadata?.version ?? 1}`} width={180} height={120} unoptimized /><span>V{metadata?.version ?? 1}</span><small>{metadata?.generator === 'api' ? 'API' : 'Codex'}</small></button>; })}</div></section>}

          {assetCompleted ? <div className="asset-complete-state"><div><span>已采用 · 已进入生成作品</span><strong>这个版本已退出当前制作状态</strong></div><div><button onClick={() => { continueWith(activeAsset); setAssetIterationOpen(true); }} type="button">基于此图继续迭代</button><button className="primary" onClick={startNewCreation} type="button">开始新图片</button></div></div> : <div className="creation-conversation asset-conversation"><div className="conversation-head"><strong>继续调整当前版本</strong><span>{assetTurns.length} 轮{activeMetadata?.conversationSummary ? ' · 已整理前序要求' : ''}</span></div>{assetTurns.length > 0 && <details className="conversation-history-details"><summary>查看最近 {Math.min(4, assetTurns.length)} 轮调整</summary><div className="conversation-turns">{assetTurns.slice(-4).map((turn, index) => <div key={turn.id}><span>{turn.provider === 'api' ? 'API' : 'Codex'} · {Math.max(1, assetTurns.length - Math.min(4, assetTurns.length) + index + 1)}</span><p>{turn.instruction}</p></div>)}</div></details>}<div className="iteration-box"><label>本轮调整（可选）<input value={adjustment} onChange={(event) => setAdjustment(event.target.value)} placeholder="不填写则按当前要求再生成一版" onKeyDown={(event) => { if (event.key === 'Enter' && !working) void runImage(adjustment); }} /></label><button className="primary" onClick={() => runImage(adjustment)} disabled={working || (executionMode === 'api' && imageConfigured !== true)} type="button">{adjustment.trim() ? '继续修改' : '再生成一版'}</button></div></div>}

          <div className="result-actions">{activeMetadata?.status !== 'adopted' && <button className="primary" onClick={adoptCurrentAsset} type="button">采用此版本</button>}<a href={`/api/file?path=${encodeURIComponent(activeAsset.path)}`} download>下载</a><button onClick={() => updateMetadata(activeAsset.path, { visualReference: !activeMetadata?.visualReference })} type="button">{activeMetadata?.visualReference ? '取消参考标记' : '加入参考素材'}</button></div>
        </> : !working && !generationFailure ? <Empty text="生成完成后，图片会显示在这里。" /> : null}
      </aside>
    </div>}

    {mode === 'references' && <section className="box asset-library compact-library">
      <BoxHeader title="参考素材" action={<label className="inline-upload">批量上传<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={upload} multiple hidden /></label>} />
      <div className="asset-filters">{(['全部', '未分类', '角色', '场景', 'Gameplay', 'Logo', '风格', 'UI'] as const).map((role) => <button className={referenceFilter === role ? 'active' : ''} onClick={() => setReferenceFilter(role)} key={role} type="button">{role}</button>)}</div>
      {filteredReferences.length ? <div className="asset-grid">{filteredReferences.map((file) => <ReferenceAssetCard file={file} metadata={metadataFor(file.path)} onSelect={() => setDetailAssetPath(file.path)} onDefault={() => updateMetadata(file.path, { defaultReference: !metadataFor(file.path)?.defaultReference })} key={file.path} />)}</div> : <Empty text="暂无这一类参考素材" />}
    </section>}

    {mode === 'works' && <section className="box asset-library compact-library">
      <BoxHeader title="生成作品" action={<button className="library-create" onClick={() => setMode('create')} type="button">制作图片</button>} />
      <div className="asset-filters">{([['all', '全部'], ['draft', '草稿'], ['adopted', '已采用']] as const).map(([key, label]) => <button className={workFilter === key ? 'active' : ''} onClick={() => setWorkFilter(key)} key={key} type="button">{label}</button>)}</div>
      {workGroups.length ? <div className="asset-grid">{workGroups.map((files) => <GeneratedWorkCard file={files[0]} metadata={metadataFor(files[0].path)} versions={files.length} onSelect={() => setDetailAssetPath(files[0].path)} key={metadataFor(files[0].path)?.groupId ?? files[0].path} />)}</div> : <Empty text="暂无生成作品" />}
    </section>}

    {referencePickerOpen && <div className="drawer-backdrop" onMouseDown={() => setReferencePickerOpen(false)}><aside className="asset-picker-drawer" onMouseDown={(event) => event.stopPropagation()}><div className="drawer-header"><h2>选择参考图片</h2><button onClick={() => setReferencePickerOpen(false)} type="button">完成 · {references.length}</button></div><div className="picker-upload"><label className="upload-button">批量上传<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} multiple hidden /></label><span>可多选，已选 {references.length} 张</span></div><div className="picker-grid">{referenceAssets.filter((file) => ['png', 'jpg', 'jpeg', 'webp'].includes(file.kind)).map((file) => <button className={references.includes(file.path) ? 'active' : ''} onClick={() => toggleReference(file.path)} key={file.path} type="button"><Image src={`/api/file?path=${encodeURIComponent(file.path)}`} alt={metadataFor(file.path)?.title ?? displayName(file)} width={260} height={190} unoptimized /><span>{references.includes(file.path) ? '已选择' : metadataFor(file.path)?.title ?? displayName(file)}</span></button>)}</div></aside></div>}

    {detailAsset && detailMetadata && <div className="drawer-backdrop" onMouseDown={() => setDetailAssetPath('')}><aside className="asset-detail-drawer" onMouseDown={(event) => event.stopPropagation()}><div className="drawer-header"><h2>{detailMetadata.source === 'generated' ? '生成作品' : '参考素材'}</h2><button onClick={() => setDetailAssetPath('')} type="button">关闭</button></div><div className="detail-media">{['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(detailAsset.kind) ? <Image src={`/api/file?path=${encodeURIComponent(detailAsset.path)}`} alt={detailMetadata.title} width={1000} height={800} unoptimized /> : <video src={`/api/file?path=${encodeURIComponent(detailAsset.path)}`} controls />}</div><div className="detail-content"><div className="detail-title"><div><strong>{detailMetadata.source === 'generated' ? '生成作品' : '参考素材'} · {detailMetadata.title}</strong><span>{detailMetadata.source === 'generated' ? `${detailMetadata.generator === 'api' ? 'OpenAI API' : 'Codex ImageGen'} · V${detailMetadata.version ?? 1}` : `本地上传 · ${detailMetadata.role ?? '未分类'}`}</span></div>{detailMetadata.source === 'generated' && <span className={`status-badge ${detailMetadata.status === 'adopted' ? 'adopted' : ''}`}>{detailMetadata.status === 'adopted' ? '已采用' : '草稿'}</span>}</div>{detailMetadata.source === 'upload' && <label className="detail-select">分类<select value={detailMetadata.role ?? '未分类'} onChange={(event) => updateMetadata(detailAsset.path, { role: event.target.value as AssetRole })}>{(['未分类', '角色', '场景', 'Gameplay', 'Logo', '风格', 'UI'] as const).map((role) => <option key={role}>{role}</option>)}</select></label>}<div className="detail-actions">{['png', 'jpg', 'jpeg', 'webp'].includes(detailAsset.kind) && <button onClick={() => continueWith(detailAsset)} type="button">用于图片制作</button>}{detailMetadata.source === 'generated' && <button onClick={() => updateMetadata(detailAsset.path, { status: detailMetadata.status === 'adopted' ? 'draft' : 'adopted' })} type="button">{detailMetadata.status === 'adopted' ? '改为草稿' : '标记已采用'}</button>}<button onClick={() => updateMetadata(detailAsset.path, { visualReference: !detailMetadata.visualReference })} type="button">{detailMetadata.visualReference ? '取消参考标记' : '加入参考素材'}</button><a href={`/api/file?path=${encodeURIComponent(detailAsset.path)}`} download>下载</a></div>{detailVersions.length > 1 && <section className="version-section"><h3>版本</h3><div>{detailVersions.map((file) => <button className={file.path === detailAsset.path ? 'active' : ''} onClick={() => setDetailAssetPath(file.path)} key={file.path} type="button"><Image src={`/api/file?path=${encodeURIComponent(file.path)}`} alt={metadataFor(file.path)?.title ?? displayName(file)} width={180} height={120} unoptimized /><span>V{metadataFor(file.path)?.version ?? 1}</span></button>)}</div></section>}{detailMetadata.prompt && <section className="detail-section"><h3>创作要求</h3><p>{detailMetadata.prompt}</p></section>}{linkedBrief?.content && <section className="detail-section"><h3>创作说明</h3><MarkdownView content={stripTitle(linkedBrief.content)} /></section>}{linkedRecord?.content && <section className="detail-section"><h3>执行记录</h3><MarkdownView content={stripTitle(linkedRecord.content)} /></section>}</div></aside></div>}
  </div>;
}

function ReferenceAssetCard({ file, metadata, onSelect, onDefault }: { file: WorkFile; metadata?: AssetMetadata; onSelect: () => void; onDefault: () => void }) {
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(file.kind);
  const src = `/api/file?path=${encodeURIComponent(file.path)}`;
  return <article className="asset-card" onClick={onSelect} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(); }} role="button" tabIndex={0}><div className="asset-preview">{isImage ? <Image src={src} alt={metadata?.title ?? displayName(file)} width={640} height={480} unoptimized /> : <video src={src} />}</div><div><span>{metadata?.defaultReference ? '默认参考' : metadata?.source === 'generated' ? '作品引用' : `上传参考 · ${metadata?.role ?? '未分类'}`}</span><strong>{metadata?.title ?? displayName(file)}</strong><div className="reference-card-foot"><small>{formatTime(file.updatedAt)}</small>{isImage && <button onClick={(event) => { event.stopPropagation(); onDefault(); }} type="button">{metadata?.defaultReference ? '取消默认' : '设为默认'}</button>}</div></div></article>;
}

function GeneratedWorkCard({ file, metadata, versions, onSelect }: { file: WorkFile; metadata?: AssetMetadata; versions: number; onSelect: () => void }) {
  return <article className="asset-card generated-card" onClick={onSelect} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(); }} role="button" tabIndex={0}><div className="asset-preview"><Image src={`/api/file?path=${encodeURIComponent(file.path)}`} alt={metadata?.title ?? displayName(file)} width={640} height={480} unoptimized /><span className="version-badge">{versions > 1 ? `${versions} 个版本` : `V${metadata?.version ?? 1}`}</span></div><div><span>{metadata?.seriesName ? `${metadata.seriesName} · ` : metadata?.creationSource === 'content' ? '内容配图 · ' : ''}{metadata?.generator === 'api' ? 'OpenAI API' : 'Codex ImageGen'} · {metadata?.status === 'adopted' ? '已采用' : '草稿'}</span><strong>{metadata?.title ?? displayName(file)}</strong><small>{formatTime(file.updatedAt)}</small></div></article>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- retained temporarily to preserve the previous local UI during the workspace migration.
function AssetStudioLegacy({ workspace, refresh, setNotice }: { workspace: Workspace; refresh: (silent?: boolean) => Promise<void>; setNotice: (notice: Notice) => void }) {
  const assets = workspace.outputs.filter((file) => file.path.startsWith('outputs/assets/'));
  const imageAssets = assets.filter((file) => ['png', 'jpg', 'jpeg', 'webp'].includes(file.kind));
  const [creationMode, setCreationMode] = useState<'new' | 'edit'>('new');
  const [title, setTitle] = useState('');
  const [usage, setUsage] = useState('Twitter 配图');
  const [message, setMessage] = useState('');
  const [format, setFormat] = useState('16:9');
  const [quality, setQuality] = useState('medium');
  const [requirements, setRequirements] = useState('');
  const [working, setWorking] = useState(false);
  const [codexRun, setCodexRun] = useState<CodexRun | null>(null);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [imageConfigured, setImageConfigured] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'create' | 'library'>('create');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'reference' | 'generated' | 'media' | 'brief'>('all');
  const activeAsset = assets.find((file) => file.path === selectedAsset);
  const activeMetadata = workspace.assetMetadata.find((item) => item.path === selectedAsset);
  const generatedAsset = imageAssets.find((file) => file.path === selectedAsset);
  const filteredAssets = assets.filter((file) => {
    const metadata = workspace.assetMetadata.find((item) => item.path === file.path);
    if (libraryFilter === 'reference') return metadata?.visualReference;
    if (libraryFilter === 'generated') return metadata?.source === 'generated';
    if (libraryFilter === 'media') return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'mov'].includes(file.kind);
    if (libraryFilter === 'brief') return file.kind === 'md';
    return true;
  });

  useEffect(() => { fetch('/api/image', { cache: 'no-store' }).then(async (response) => await response.json() as { configured?: boolean }).then((result) => setImageConfigured(Boolean(result.configured))).catch(() => setImageConfigured(false)); }, []);

  function briefText() { return `素材类型：图片\n用途：${usage}\n需要表达：${message}\n规格：${format}\n要求与限制：${requirements}\n参考素材：${references.join('、') || '无'}`; }
  async function saveBrief() {
    setWorking(true);
    try { await api({ action: 'saveOutput', category: 'assets', title, content: briefText() }); await refresh(true); setNotice({ tone: 'success', text: '素材 Brief 已保存' }); }
    catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '保存失败' }); }
    finally { setWorking(false); }
  }
  async function runCodex() {
    setWorking(true);
    setCodexRun(null);
    try {
      const request = await api<{ path: string }>({ action: 'createRequest', kind: 'creation', outputType: 'assets', title: title || '图片素材', brief: `${briefText()}\n\n请根据项目记忆完善成可直接用于图片模型的创意方向与提示词。输出应包含主体、环境、构图、氛围、色彩、细节和需要避免的内容。` });
      await refresh(true);
      const run = await executeCodex(request.path, setCodexRun);
      await refresh(true);
      if (run.status === 'failed') throw new Error(run.error || '素材任务未完成');
      const result = run.resultFiles.find((file) => file.path.startsWith('outputs/assets/'));
      if (result) setRequirements(stripTitle(result.content));
      setNotice({ tone: 'success', text: '创意方向已完善，可以继续修改或生成图片' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '创建失败' }); }
    finally { setWorking(false); }
  }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setWorking(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('读取素材失败')); reader.readAsDataURL(file); });
      const result = await api<{ path: string }>({ action: 'uploadAsset', title: file.name.replace(/\.[^.]+$/, ''), mimeType: file.type, data: dataUrl.split(',')[1] ?? '' });
      if (file.type.startsWith('image/')) setReferences((current) => [...new Set([...current, result.path])]);
      await refresh(true); setNotice({ tone: 'success', text: file.type.startsWith('image/') ? '素材已上传并设为本次参考' : '素材已上传' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '上传失败' }); }
    finally { setWorking(false); event.target.value = ''; }
  }

  function toggleReference(path: string) {
    setReferences((current) => current.includes(path) ? current.filter((item) => item !== path) : [...current, path]);
  }

  async function generateImage() {
    setWorking(true);
    try {
      const prompt = [`为 Lumiterra V2 制作${usage}。`, message, requirements && `补充创作要求：\n${requirements}`, references.length && '请认真使用所附参考图片中的角色、世界观、配色或构图信息；不要重新绘制或伪造官方 Logo。'].filter(Boolean).join('\n\n');
      const response = await fetch('/api/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, prompt, usage, ratio: format, quality, references, parentPath: creationMode === 'edit' ? selectedAsset : '' }) });
      const result = await response.json() as { path?: string; error?: string };
      if (!response.ok || !result.path) throw new Error(result.error || '图片生成失败');
      setSelectedAsset(result.path); setCreationMode('edit'); setReferences([result.path]);
      await refresh(true); setNotice({ tone: 'success', text: '图片已生成并保存到素材库' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '图片生成失败' }); }
    finally { setWorking(false); }
  }

  async function markReference(path: string, value: boolean) {
    try { await api({ action: 'setAssetReference', path, visualReference: value }); await refresh(true); setNotice({ tone: 'success', text: value ? '已设为视觉参考' : '已取消视觉参考' }); }
    catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '操作失败' }); }
  }

  function continueWith(file: WorkFile) {
    setSelectedAsset(file.path); setReferences([file.path]); setCreationMode('edit'); setMode('create');
    if (!title) setTitle(`${displayName(file)}-迭代`);
  }

  return <div className="page">
    <SectionTitle title="素材制作" action={<label className="upload-button">上传素材<input type="file" accept="image/*,video/mp4,video/webm,video/quicktime" onChange={upload} hidden /></label>} />
    <div className="workspace-tabs"><button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')} type="button">素材创作</button><button className={mode === 'library' ? 'active' : ''} onClick={() => setMode('library')} type="button">素材库 <span>{assets.length}</span></button></div>
    {mode === 'create' && <div className="asset-create-layout">
      <section className="box asset-form"><BoxHeader title={creationMode === 'new' ? '新建图片' : '修改图片'} />
        <div className="type-switch"><button className={creationMode === 'new' ? 'active' : ''} onClick={() => { setCreationMode('new'); setSelectedAsset(''); }} type="button">新建图片</button><button className={creationMode === 'edit' ? 'active' : ''} onClick={() => setCreationMode('edit')} type="button">修改已有图片</button></div>
        <label>素材名称<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>用途<select value={usage} onChange={(event) => setUsage(event.target.value)}><option>Twitter 配图</option><option>Key Visual</option><option>机制说明</option><option>社区内容</option><option>产品演示</option></select></label>
        <label>画面目标<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="用户第一眼需要看到和感受到什么？" /></label>
        <div className="asset-options"><label>图片比例<select value={format} onChange={(event) => setFormat(event.target.value)}><option>1:1</option><option>16:9</option><option>4:5</option><option>9:16</option></select></label><label>质量<select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="low">快速</option><option value="medium">标准</option><option value="high">精细</option></select></label></div>
        <label>补充要求<textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="角色、环境、构图、氛围、配色和需要避免的内容" /></label>
        <div className="reference-picker"><div><strong>参考素材</strong><span>已选 {references.length} 张</span><label className="inline-upload">本地上传<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} hidden /></label></div>{imageAssets.length === 0 ? <Empty text="先上传角色图、Gameplay、Logo 或历史视觉" /> : <div className="reference-grid">{imageAssets.map((file) => <button className={references.includes(file.path) ? 'active' : ''} onClick={() => toggleReference(file.path)} key={file.path} type="button"><Image src={`/api/file?path=${encodeURIComponent(file.path)}`} alt={displayName(file)} width={180} height={120} unoptimized /><span>{references.includes(file.path) ? '已选择' : displayName(file)}</span></button>)}</div>}</div>
        <ContextList />
        <div className="form-actions"><button onClick={runCodex} disabled={working || !title} type="button">完善创意方向</button><button className="primary" onClick={generateImage} disabled={working || !title || !message} type="button">{working ? '正在处理…' : '生成图片'}</button><button onClick={saveBrief} disabled={working || !title} type="button">保存 Brief</button></div>
        {imageConfigured === false && <p className="api-key-note">生成图片前，需要在本地环境配置 OPENAI_API_KEY。上传、Brief 和 Codex 创意分析仍可正常使用。</p>}
        <CodexRunView run={codexRun} />
      </section>
      <aside className="box generation-result"><BoxHeader title="生成结果" />{generatedAsset ? <><div className="generated-preview"><Image src={`/api/file?path=${encodeURIComponent(generatedAsset.path)}`} alt={displayName(generatedAsset)} width={900} height={900} unoptimized /></div><div className="result-actions"><button onClick={() => { setReferences([generatedAsset.path]); setCreationMode('edit'); }} type="button">继续修改</button><button onClick={generateImage} disabled={working} type="button">再生成一版</button><a href={`/api/file?path=${encodeURIComponent(generatedAsset.path)}`} download>下载</a><button onClick={() => markReference(generatedAsset.path, !activeMetadata?.visualReference)} type="button">{activeMetadata?.visualReference ? '取消视觉参考' : '设为视觉参考'}</button></div></> : <Empty text="生成后的图片会直接显示在这里，并自动保存到素材库。" />}</aside>
    </div>}
    {mode === 'library' && <div className="assets-layout library-only">
      <section className="box asset-library"><BoxHeader title="全部素材" action={<div className="library-actions"><span>{filteredAssets.length} 项</span><button onClick={() => setMode('create')} type="button">新建素材</button></div>} />
        <div className="asset-filters">{([['all','全部'],['reference','视觉参考'],['generated','生成图片'],['media','图片与视频'],['brief','Brief']] as const).map(([key,label]) => <button className={libraryFilter === key ? 'active' : ''} onClick={() => setLibraryFilter(key)} key={key} type="button">{label}</button>)}</div>
        {activeAsset && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(activeAsset.kind) && <div className="asset-detail"><Image src={`/api/file?path=${encodeURIComponent(activeAsset.path)}`} alt={displayName(activeAsset)} width={1200} height={800} unoptimized /><div><strong>{displayName(activeAsset)}</strong><span>{activeMetadata?.source === 'generated' ? 'AI 生成' : '本地上传'}{activeMetadata?.usage ? ` · ${activeMetadata.usage}` : ''}</span>{activeMetadata?.prompt && <p>{activeMetadata.prompt}</p>}<div><button onClick={() => continueWith(activeAsset)} type="button">继续创作</button><button onClick={() => markReference(activeAsset.path, !activeMetadata?.visualReference)} type="button">{activeMetadata?.visualReference ? '取消视觉参考' : '设为视觉参考'}</button><a href={`/api/file?path=${encodeURIComponent(activeAsset.path)}`} download>下载</a><button onClick={() => setSelectedAsset('')} type="button">关闭</button></div></div></div>}
        {activeAsset?.kind === 'md' && <div className="asset-document"><MarkdownView content={activeAsset.content ?? ''} /><button onClick={() => setSelectedAsset('')} type="button">关闭</button></div>}
        {assets.length === 0 && <Empty text="暂无素材。可以创建 Brief 或上传已有素材。" />}
        <div className="asset-grid">{filteredAssets.map((file) => <AssetCard file={file} metadata={workspace.assetMetadata.find((item) => item.path === file.path)} onSelect={() => setSelectedAsset(file.path)} key={file.path} />)}</div>
      </section>
    </div>}
  </div>;
}

type MarketingKind = 'timeline' | 'todo';
type MarketingSelection = { kind: MarketingKind; id: string } | null;
type MarketingEditorState = {
  kind: MarketingKind;
  id?: string;
  title: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: string;
  notes: string;
  tags: string;
  timelineId: string;
  contentPaths: string[];
  assetPaths: string[];
};

function localDateValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function marketingStatusLabel(kind: MarketingKind, status: string) {
  if (kind === 'timeline') return ({ planned: '计划中', active: '进行中', done: '已结束' } as Record<string, string>)[status] ?? status;
  return ({ todo: '待做', doing: '进行中', done: '已完成' } as Record<string, string>)[status] ?? status;
}

function MarketingLinkedOutputs({ contentPaths, assetPaths, contentFiles, assetFiles, setView }: { contentPaths: string[]; assetPaths: string[]; contentFiles: WorkFile[]; assetFiles: WorkFile[]; setView: (view: View) => void }) {
  const linkedContent = contentPaths.flatMap((path) => { const file = contentFiles.find((entry) => entry.path === path); return file ? [file] : []; });
  const linkedAssets = assetPaths.flatMap((path) => { const file = assetFiles.find((entry) => entry.path === path); return file ? [file] : []; });
  return <div className="marketing-linked"><div className="marketing-subhead"><strong>关联内容</strong><span>仅作引用，不会改变原记录</span></div>{linkedContent.length === 0 && linkedAssets.length === 0 ? <p className="marketing-muted">暂未关联推文或素材。</p> : <>{linkedContent.map((file) => <button onClick={() => setView('content')} type="button" key={file.path}><span>推文</span><strong>{contentPreview(file.content)}</strong></button>)}{linkedAssets.map((file) => <button onClick={() => setView('assets')} type="button" key={file.path}><span>素材</span><strong>{displayName(file)}</strong></button>)}</>}</div>;
}

function MarketingBoard({ workspace, refresh, setNotice, setView }: { workspace: Workspace; refresh: (silent?: boolean) => Promise<void>; setNotice: (notice: Notice) => void; setView: (view: View) => void }) {
  const [selected, setSelected] = useState<MarketingSelection>(null);
  const [editor, setEditor] = useState<MarketingEditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const marketing = workspace.marketing ?? { timeline: [], todos: [] };
  const timeline = [...marketing.timeline].sort((a, b) => a.startDate.localeCompare(b.startDate) || b.updatedAt.localeCompare(a.updatedAt));
  const todos = [...marketing.todos].sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || b.updatedAt.localeCompare(a.updatedAt));
  const contentFiles = workspace.outputs.filter((file) => file.path.startsWith('outputs/twitter/'));
  const assetFiles = workspace.outputs.filter((file) => file.path.startsWith('outputs/assets/'));
  const activeTimeline = selected?.kind === 'timeline' ? marketing.timeline.find((item) => item.id === selected.id) : undefined;
  const activeTodo = selected?.kind === 'todo' ? marketing.todos.find((item) => item.id === selected.id) : undefined;
  const linkedTodos = activeTimeline ? todos.filter((item) => item.timelineId === activeTimeline.id) : [];

  function newEditor(kind: MarketingKind): MarketingEditorState {
    return { kind, title: '', startDate: localDateValue(), endDate: '', dueDate: '', status: kind === 'timeline' ? 'planned' : 'todo', notes: '', tags: '', timelineId: '', contentPaths: [], assetPaths: [] };
  }

  function editTimeline(item: MarketingTimelineItem) {
    setEditor({ kind: 'timeline', id: item.id, title: item.title, startDate: item.startDate, endDate: item.endDate ?? '', dueDate: '', status: item.status, notes: item.notes ?? '', tags: item.tags.join(', '), timelineId: '', contentPaths: item.contentPaths, assetPaths: item.assetPaths });
  }

  function editTodo(item: MarketingTodo) {
    setEditor({ kind: 'todo', id: item.id, title: item.title, startDate: '', endDate: '', dueDate: item.dueDate ?? '', status: item.status, notes: item.notes ?? '', tags: '', timelineId: item.timelineId ?? '', contentPaths: item.contentPaths, assetPaths: item.assetPaths });
  }

  async function saveItem() {
    if (!editor?.title.trim()) return;
    setSaving(true);
    try {
      const item = await api<MarketingTimelineItem | MarketingTodo>({
        action: 'saveMarketingItem', ...editor,
        tags: editor.tags.split(/[,，\s]+/).filter(Boolean),
      });
      await refresh(true);
      setSelected({ kind: editor.kind, id: item.id });
      setEditor(null);
      setNotice({ tone: 'success', text: editor.id ? 'Marketing 记录已更新' : 'Marketing 记录已创建' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '保存失败' }); }
    finally { setSaving(false); }
  }

  async function removeItem(kind: MarketingKind, id: string) {
    if (!window.confirm('只会删除这条 Marketing 记录；关联的推文和素材不会删除。确认删除吗？')) return;
    try {
      await api({ action: 'deleteMarketingItem', kind, id });
      setSelected(null);
      await refresh(true);
      setNotice({ tone: 'success', text: kind === 'timeline' ? 'Timeline 事项已删除，原内容与素材均已保留' : 'Todo 已删除，原内容与素材均已保留' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '删除失败' }); }
  }

  async function duplicate(kind: MarketingKind, item: MarketingTimelineItem | MarketingTodo) {
    try {
      const saved = kind === 'timeline'
        ? await api<MarketingTimelineItem>({ action: 'saveMarketingItem', kind, title: `${item.title} 副本`, startDate: (item as MarketingTimelineItem).startDate, endDate: (item as MarketingTimelineItem).endDate, status: 'planned', notes: item.notes, tags: (item as MarketingTimelineItem).tags, contentPaths: item.contentPaths, assetPaths: item.assetPaths })
        : await api<MarketingTodo>({ action: 'saveMarketingItem', kind, title: `${item.title} 副本`, dueDate: (item as MarketingTodo).dueDate, status: 'todo', notes: item.notes, timelineId: (item as MarketingTodo).timelineId, contentPaths: item.contentPaths, assetPaths: item.assetPaths });
      await refresh(true);
      setSelected({ kind, id: saved.id });
      setNotice({ tone: 'success', text: '已复制为一条新的记录' });
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '复制失败' }); }
  }

  async function updateTodoStatus(item: MarketingTodo, status: MarketingTodo['status']) {
    try {
      await api({ action: 'saveMarketingItem', kind: 'todo', ...item, status });
      await refresh(true);
    } catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '更新失败' }); }
  }

  function togglePath(field: 'contentPaths' | 'assetPaths', path: string) {
    if (!editor) return;
    setEditor({ ...editor, [field]: editor[field].includes(path) ? editor[field].filter((item) => item !== path) : [...editor[field], path] });
  }

  return <div className="page marketing-page">
    <SectionTitle title="Marketing" action={<div className="marketing-title-actions"><button onClick={() => setEditor(newEditor('todo'))} type="button">新建 Todo</button><button className="primary" onClick={() => setEditor(newEditor('timeline'))} type="button">新建 Timeline</button></div>} />
    <div className="marketing-intro"><div><strong>把阶段计划和执行事项放在一起</strong><span>推文与素材只在需要时关联，不会被自动归集。</span></div><div><span>{timeline.filter((item) => item.status !== 'done').length} 个进行中计划</span><span>{todos.filter((item) => item.status !== 'done').length} 项待完成</span></div></div>
    <div className="marketing-board-grid">
      <section className="box marketing-column"><BoxHeader title="Timeline" action={<button onClick={() => setEditor(newEditor('timeline'))} type="button">＋ 添加计划</button>} />
        {timeline.length === 0 ? <div className="marketing-empty"><strong>还没有运营计划</strong><p>先记录一个阶段、Campaign 或重要发布时间段。</p><button onClick={() => setEditor(newEditor('timeline'))} type="button">添加第一项</button></div> : <div className="timeline-list">{timeline.map((item) => <button className="marketing-row" onClick={() => setSelected({ kind: 'timeline', id: item.id })} type="button" key={item.id}><span className="timeline-date"><b>{item.startDate.slice(5).replace('-', '/')}</b>{item.endDate && <small>— {item.endDate.slice(5).replace('-', '/')}</small>}</span><span className="marketing-row-main"><strong>{item.title}</strong><small>{item.tags.slice(0, 3).map((tag) => `#${tag}`).join('  ') || '未设置标签'}</small></span><span className={`marketing-status ${item.status}`}>{marketingStatusLabel('timeline', item.status)}</span><span className="marketing-link-count">{item.contentPaths.length + item.assetPaths.length ? `关联 ${item.contentPaths.length + item.assetPaths.length}` : '未关联'}</span></button>)}</div>}
      </section>
      <section className="box marketing-column"><BoxHeader title="Todo" action={<button onClick={() => setEditor(newEditor('todo'))} type="button">＋ 添加任务</button>} />
        {todos.length === 0 ? <div className="marketing-empty"><strong>还没有待办</strong><p>Todo 可以独立存在，也可以归入某个 Timeline。</p><button onClick={() => setEditor(newEditor('todo'))} type="button">添加第一项</button></div> : <div className="todo-list">{todos.map((item) => <div className={`todo-row ${item.status}`} key={item.id}><button className="todo-check" aria-label="更新完成状态" onClick={() => updateTodoStatus(item, item.status === 'done' ? 'todo' : 'done')} type="button">{item.status === 'done' ? '✓' : ''}</button><button className="todo-main" onClick={() => setSelected({ kind: 'todo', id: item.id })} type="button"><strong>{item.title}</strong><small>{item.timelineId ? timeline.find((entry) => entry.id === item.timelineId)?.title || '未规划' : '独立任务'}{item.dueDate ? ` · ${item.dueDate.slice(5).replace('-', '/')}` : ''}</small></button>{item.status !== 'done' && <button className="todo-state" onClick={() => updateTodoStatus(item, item.status === 'todo' ? 'doing' : 'todo')} type="button">{marketingStatusLabel('todo', item.status)}</button>}</div>)}</div>}
      </section>
    </div>

    {(activeTimeline || activeTodo) && <div className="drawer-backdrop" onMouseDown={() => setSelected(null)}><aside className="marketing-detail-drawer" onMouseDown={(event) => event.stopPropagation()}>{activeTimeline ? <>
      <header className="drawer-header"><div><span>Timeline</span><h2>{activeTimeline.title}</h2></div><button onClick={() => setSelected(null)} type="button">关闭</button></header>
      <div className="marketing-detail-body"><div className="marketing-detail-meta"><span className={`marketing-status ${activeTimeline.status}`}>{marketingStatusLabel('timeline', activeTimeline.status)}</span><span>{activeTimeline.startDate}{activeTimeline.endDate ? ` — ${activeTimeline.endDate}` : ''}</span></div>{activeTimeline.notes && <p className="marketing-notes">{activeTimeline.notes}</p>}{activeTimeline.tags.length > 0 && <p className="marketing-tags">{activeTimeline.tags.map((tag) => `#${tag}`).join('  ')}</p>}<div className="marketing-subhead"><strong>该计划下的 Todo</strong><span>{linkedTodos.length} 项</span></div>{linkedTodos.length ? linkedTodos.map((todo) => <button className="marketing-related-todo" onClick={() => setSelected({ kind: 'todo', id: todo.id })} type="button" key={todo.id}><strong>{todo.title}</strong><span>{marketingStatusLabel('todo', todo.status)}</span></button>) : <p className="marketing-muted">暂未归入 Todo。</p>}<MarketingLinkedOutputs contentPaths={activeTimeline.contentPaths} assetPaths={activeTimeline.assetPaths} contentFiles={contentFiles} assetFiles={assetFiles} setView={setView} /></div>
      <footer className="marketing-detail-actions"><button onClick={() => duplicate('timeline', activeTimeline)} type="button">复制</button><button onClick={() => editTimeline(activeTimeline)} type="button">编辑</button><button className="danger" onClick={() => removeItem('timeline', activeTimeline.id)} type="button">删除</button></footer>
    </> : activeTodo ? <>
      <header className="drawer-header"><div><span>Todo</span><h2>{activeTodo.title}</h2></div><button onClick={() => setSelected(null)} type="button">关闭</button></header>
      <div className="marketing-detail-body"><div className="marketing-detail-meta"><span className={`marketing-status ${activeTodo.status}`}>{marketingStatusLabel('todo', activeTodo.status)}</span><span>{activeTodo.dueDate ? `截止 ${activeTodo.dueDate}` : '未设置截止日期'}</span></div>{activeTodo.timelineId && <button className="marketing-parent-link" onClick={() => setSelected({ kind: 'timeline', id: activeTodo.timelineId! })} type="button">归入：{timeline.find((item) => item.id === activeTodo.timelineId)?.title || '未规划'}</button>}{activeTodo.notes && <p className="marketing-notes">{activeTodo.notes}</p>}<MarketingLinkedOutputs contentPaths={activeTodo.contentPaths} assetPaths={activeTodo.assetPaths} contentFiles={contentFiles} assetFiles={assetFiles} setView={setView} /></div>
      <footer className="marketing-detail-actions"><button onClick={() => duplicate('todo', activeTodo)} type="button">复制</button><button onClick={() => editTodo(activeTodo)} type="button">编辑</button><button className="danger" onClick={() => removeItem('todo', activeTodo.id)} type="button">删除</button></footer>
    </> : null}</aside></div>}

    {editor && <div className="marketing-modal-backdrop" onMouseDown={() => !saving && setEditor(null)}><section className="marketing-editor" onMouseDown={(event) => event.stopPropagation()}><header><div><span>{editor.kind === 'timeline' ? 'Timeline' : 'Todo'}</span><h2>{editor.id ? '编辑记录' : editor.kind === 'timeline' ? '新建计划' : '新建任务'}</h2></div><button onClick={() => setEditor(null)} disabled={saving} type="button">关闭</button></header><div className="marketing-editor-body">
      <label className="marketing-wide">名称<input autoFocus value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} placeholder={editor.kind === 'timeline' ? '例如：V2 预热阶段' : '例如：完成机制预告推文'} /></label>
      {editor.kind === 'timeline' ? <><label>开始日期<input type="date" value={editor.startDate} onChange={(event) => setEditor({ ...editor, startDate: event.target.value })} /></label><label>结束日期（可选）<input type="date" min={editor.startDate} value={editor.endDate} onChange={(event) => setEditor({ ...editor, endDate: event.target.value })} /></label><label>状态<select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })}><option value="planned">计划中</option><option value="active">进行中</option><option value="done">已结束</option></select></label><label>标签（可选）<input value={editor.tags} onChange={(event) => setEditor({ ...editor, tags: event.target.value })} placeholder="预热, Twitter" /></label></> : <><label>截止日期（可选）<input type="date" value={editor.dueDate} onChange={(event) => setEditor({ ...editor, dueDate: event.target.value })} /></label><label>状态<select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })}><option value="todo">待做</option><option value="doing">进行中</option><option value="done">已完成</option></select></label><label className="marketing-wide">归入 Timeline（可选）<select value={editor.timelineId} onChange={(event) => setEditor({ ...editor, timelineId: event.target.value })}><option value="">不归入计划，作为独立任务</option>{timeline.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label></>}
      <label className="marketing-wide">备注（可选）<textarea value={editor.notes} onChange={(event) => setEditor({ ...editor, notes: event.target.value })} placeholder="记录目标、要求或协作信息…" /></label>
      <details className="marketing-link-picker marketing-wide"><summary><span><strong>关联已有推文</strong><small>可选 · 已选 {editor.contentPaths.length}</small></span><b>选择</b></summary><div>{contentFiles.length ? contentFiles.map((file) => <label key={file.path}><input type="checkbox" checked={editor.contentPaths.includes(file.path)} onChange={() => togglePath('contentPaths', file.path)} /><span><strong>{contentPreview(file.content)}</strong><small>{formatTime(file.updatedAt)}</small></span></label>) : <p>内容创作中还没有可关联的记录。</p>}</div></details>
      <details className="marketing-link-picker marketing-wide"><summary><span><strong>关联已有素材</strong><small>可选 · 已选 {editor.assetPaths.length}</small></span><b>选择</b></summary><div>{assetFiles.length ? assetFiles.map((file) => <label key={file.path}><input type="checkbox" checked={editor.assetPaths.includes(file.path)} onChange={() => togglePath('assetPaths', file.path)} /><span><strong>{displayName(file)}</strong><small>{formatTime(file.updatedAt)}</small></span></label>) : <p>素材工作室中还没有可关联的记录。</p>}</div></details>
    </div><footer><span>关联只建立引用，不会移动或修改原内容。</span><div><button onClick={() => setEditor(null)} disabled={saving} type="button">取消</button><button className="primary" onClick={saveItem} disabled={saving || !editor.title.trim()} type="button">{saving ? '保存中…' : '保存'}</button></div></footer></section></div>}
  </div>;
}

type KnowledgeFilter = 'all' | 'source' | 'insight' | 'topic';

const KNOWLEDGE_FILTERS: Array<{ id: KnowledgeFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'topic', label: '主题' },
  { id: 'insight', label: '结论' },
  { id: 'source', label: '资料' },
];

function knowledgeTypeLabel(type: KnowledgeItemType) {
  return ({ source: '资料', discussion: '讨论', insight: '结论', topic: '主题', experiment: '复盘', context: '资料包' } as const)[type];
}

function KnowledgeBase({ workspace, refresh, setNotice }: { workspace: Workspace; refresh: (silent?: boolean) => Promise<void>; setNotice: (notice: Notice) => void }) {
  const [filter, setFilter] = useState<KnowledgeFilter>('all');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [conversationPaths, setConversationPaths] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPath, setSelectedPath] = useState(() => workspace.knowledgeMetadata.find((item) => item.type === 'topic' && item.status !== 'archived')?.path ?? workspace.knowledgeMetadata.find((item) => item.status !== 'archived')?.path ?? '');

  const typeOrder: Record<KnowledgeFilter, number> = { all: 0, topic: 1, insight: 2, source: 3 };
  const allItems = workspace.knowledgeMetadata.filter((item) => item.status !== 'archived').sort((a, b) => (typeOrder[a.type as KnowledgeFilter] ?? 9) - (typeOrder[b.type as KnowledgeFilter] ?? 9) || b.updatedAt.localeCompare(a.updatedAt));
  const query = search.trim().toLowerCase();
  const expandedTerms = query ? [...new Set([query, ...Object.entries(workspace.knowledgeAliases).flatMap(([term, aliases]) => [term, ...aliases].some((value) => value.toLowerCase().includes(query)) ? [term, ...aliases] : []).map((value) => value.toLowerCase())])] : [];
  const visibleItems = allItems.filter((item) => {
    if (!query && filter !== 'all' && item.type !== filter) return false;
    if (!query) return true;
    const file = workspace.knowledgeFiles.find((entry) => entry.path === item.path);
    const text = [item.id, item.title, item.type, item.status, item.sourceUrl, item.reason, ...item.tags, file?.content].filter(Boolean).join('\n').toLowerCase();
    return expandedTerms.some((term) => text.includes(term));
  });
  const activeMetadata = workspace.knowledgeMetadata.find((item) => item.path === selectedPath);
  const activeFile = workspace.knowledgeFiles.find((file) => file.path === selectedPath);

  async function changeStatus(status: KnowledgeStatus) {
    if (!activeMetadata) return;
    try {
      await api({ action: 'updateKnowledgeStatus', path: activeMetadata.path, status });
      if (status === 'archived') setSelectedPath('');
      await refresh(true);
      setNotice({ tone: 'success', text: status === 'archived' ? '知识记录已归档' : '知识状态已更新' });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : '更新失败' });
    }
  }

  return <div className="page knowledge-page">
    <section className="knowledge-hero">
      <div><h1>知识库</h1><p>先看主题建立全貌，再看最新结论，需要时直接打开源头资料。</p></div>
      <label className="knowledge-main-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索主题、结论或源头资料" /></label>
      <button className="primary" onClick={() => { setConversationPaths([]); setCaptureOpen(true); }} type="button">记一条</button>
    </section>

    <div className="knowledge-browse-head">
      <nav aria-label="知识筛选">{KNOWLEDGE_FILTERS.map((item) => <button className={filter === item.id && !query ? 'active' : ''} onClick={() => { setFilter(item.id); setSearch(''); }} type="button" key={item.id}>{item.label}</button>)}</nav>
      <span>{query ? `找到 ${visibleItems.length} 条` : allItems.length ? `共 ${visibleItems.length} 条` : ''}</span>
    </div>

    <div className="knowledge-split-layout">
      <section className="box knowledge-feed">
        <BoxHeader title={query ? '搜索结果' : filter === 'all' ? '知识入口' : KNOWLEDGE_FILTERS.find((item) => item.id === filter)?.label ?? '记录'} />
        {visibleItems.length === 0 ? <div className="knowledge-friendly-empty"><strong>{query ? '没有找到相关内容' : '这里还没有记录'}</strong><p>{query ? '换一个词试试，标题、正文和标签都可以搜索。' : '主题、结论和源头资料会在这里形成清晰的阅读路径。'}</p>{!query && <button onClick={() => { setConversationPaths([]); setCaptureOpen(true); }} type="button">保存第一份资料</button>}</div> : visibleItems.map((item) => {
          const file = workspace.knowledgeFiles.find((entry) => entry.path === item.path);
          const preview = (stripTitle(file?.content ?? '').split(/\n\s*\n/).map((paragraph) => paragraph.trim()).find((paragraph) => paragraph && !/^(#{1,6}\s|[-*]\s|\|)/.test(paragraph)) ?? '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[`*_>]/g, '').trim().slice(0, 150);
          return <button className={`knowledge-feed-row ${selectedPath === item.path ? 'active' : ''}`} onClick={() => setSelectedPath(item.path)} type="button" key={item.id}><span className={`knowledge-kind ${item.type}`}>{knowledgeTypeLabel(item.type)}</span><div><strong>{item.title}</strong><p>{preview || '打开查看完整内容'}</p>{item.tags.length > 0 && <small>{item.tags.slice(0, 3).map((tag) => `#${tag}`).join('  ')}</small>}</div></button>;
        })}
      </section>
      <section className="box knowledge-reader">{!activeMetadata || !activeFile ? <Empty text="从左侧选择一项查看内容" /> : <>
      <div className="knowledge-reader-head"><span>{knowledgeTypeLabel(activeMetadata.type)} · {formatTime(activeMetadata.updatedAt)}</span></div>
      <div className="knowledge-reader-title"><div><h2>{activeMetadata.title}</h2>{activeMetadata.tags.length > 0 && <p>{activeMetadata.tags.map((tag) => `#${tag}`).join('  ')}</p>}</div><div className="knowledge-reader-actions"><button onClick={() => { setConversationPaths([activeMetadata.path]); setCaptureOpen(true); }} type="button">围绕它继续讨论</button>{activeMetadata.sourceUrl && <a href={activeMetadata.sourceUrl} target="_blank" rel="noreferrer">查看原始链接 ↗</a>}</div></div>
      <MarkdownView content={stripTitle(activeFile.content ?? '')} className="knowledge-document" linksNewTab />
      <details className="knowledge-record-info"><summary>记录信息</summary><p>{activeMetadata.id} · 版本 {activeMetadata.version}</p><button onClick={() => changeStatus('archived')} type="button">归档这条记录</button></details>
    </>}</section>
    </div>
    {captureOpen && <AiWorkspaceModal mode="knowledge" workspace={workspace} initialTitle={activeMetadata && conversationPaths.length ? activeMetadata.title : '知识讨论'} initialKnowledgePaths={conversationPaths} onClose={() => setCaptureOpen(false)} onSaved={(path) => setSelectedPath(path)} refresh={refresh} setNotice={setNotice} />}
  </div>;
}

function AssetCard({ file, metadata, onSelect }: { file: WorkFile; metadata?: AssetMetadata; onSelect: () => void }) {
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(file.kind);
  const isVideo = ['mp4', 'webm', 'mov'].includes(file.kind);
  const src = `/api/file?path=${encodeURIComponent(file.path)}`;
  return <article className="asset-card" onClick={onSelect} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(); }} role="button" tabIndex={0}>
    <div className="asset-preview">{isImage && <Image src={src} alt={displayName(file)} width={640} height={480} unoptimized />}{isVideo && <video src={src} controls />}{!isImage && !isVideo && <div className="brief-preview"><span>素材说明</span><p>{stripTitle(file.content).slice(0, 120)}</p></div>}</div>
    <div><span>{metadata?.visualReference ? '视觉参考' : metadata?.source === 'generated' ? 'AI 生成' : isImage ? '图片' : isVideo ? '视频' : 'Brief'}</span><strong>{displayName(file)}</strong><small>{formatTime(file.updatedAt)}</small></div>
  </article>;
}

function MemoryDrawer({ workspace, refresh, close, setNotice }: { workspace: Workspace; refresh: (silent?: boolean) => Promise<void>; close: () => void; setNotice: (notice: Notice) => void }) {
  const [tab, setTab] = useState<MemoryKey>('current');
  const [content, setContent] = useState(workspace.memory.current);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const records = workspace.records.filter((file) => !file.path.includes('/requests/')).slice(0, 8);
  const [selectedRecord, setSelectedRecord] = useState(records[0]?.path ?? '');
  const activeRecord = records.find((file) => file.path === selectedRecord);
  function visibleMemory(next: MemoryKey) { return next === 'changelog' ? workspace.memory[next].replace(/ → (?:records|outputs)\/[^\s]+/g, '') : workspace.memory[next]; }
  function changeTab(next: MemoryKey) { setTab(next); setContent(visibleMemory(next)); setEditing(false); }
  async function save() {
    setSaving(true);
    try { await api({ action: 'saveMemory', key: tab, content }); await refresh(true); setEditing(false); setNotice({ tone: 'success', text: '项目记忆已更新' }); }
    catch (error) { setNotice({ tone: 'error', text: error instanceof Error ? error.message : '保存失败' }); }
    finally { setSaving(false); }
  }
  return <div className="drawer-backdrop" onMouseDown={close}><aside className="memory-drawer" onMouseDown={(event) => event.stopPropagation()}>
    <div className="drawer-header"><h2>项目记忆</h2><div>{tab !== 'changelog' && <button onClick={() => setEditing(!editing)} type="button">{editing ? '预览' : '编辑'}</button>}<button onClick={close} type="button">关闭</button></div></div>
    <div className="drawer-tabs"><button className={tab === 'current' ? 'active' : ''} onClick={() => changeTab('current')} type="button">当前背景</button><button className={tab === 'openQuestions' ? 'active' : ''} onClick={() => changeTab('openQuestions')} type="button">待确认问题</button><button className={tab === 'changelog' ? 'active' : ''} onClick={() => changeTab('changelog')} type="button">更新记录</button></div>
    {editing ? <textarea value={content} onChange={(event) => setContent(event.target.value)} spellCheck={false} /> : <MarkdownView content={content} className="memory-document" />}
    {editing && <button className="primary drawer-save" onClick={save} disabled={saving} type="button">{saving ? '保存中…' : '保存修改'}</button>}
    <section className="memory-records"><h3>最近工作记录</h3>{records.length === 0 && <Empty text="暂无记录" />}{records.map((file) => <FileRow file={file} label="记录" onClick={() => setSelectedRecord(file.path)} key={file.path} />)}{activeRecord && <MarkdownView content={activeRecord.content ?? ''} className="record-document" />}</section>
  </aside></div>;
}
