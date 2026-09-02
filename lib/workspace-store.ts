import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';

const ROOT = resolve(/* turbopackIgnore: true */ process.cwd());
const MEMORY_DIR = join(ROOT, 'memory');
const SOURCES_DIR = join(ROOT, 'sources');
const RECORDS_DIR = join(ROOT, 'records');
const OUTPUTS_DIR = join(ROOT, 'outputs');
const KNOWLEDGE_DIR = join(ROOT, 'knowledge');
const SOURCE_SNAPSHOTS_DIR = join(ROOT, 'snapshots', 'sources');
const KNOWLEDGE_SNAPSHOTS_DIR = join(ROOT, 'snapshots', 'knowledge');
const MANIFEST_PATH = join(ROOT, 'data', 'workspace-manifest.json');
const ASSET_METADATA_PATH = join(ROOT, 'data', 'asset-metadata.json');
const CONTENT_METADATA_PATH = join(ROOT, 'data', 'content-metadata.json');
const KNOWLEDGE_METADATA_PATH = join(ROOT, 'data', 'knowledge-metadata.json');
const KNOWLEDGE_USAGE_PATH = join(ROOT, 'data', 'knowledge-usage.json');
const KNOWLEDGE_ALIASES_PATH = join(ROOT, 'data', 'knowledge-aliases.json');
const ASSISTANT_SESSIONS_PATH = join(ROOT, 'data', 'assistant-sessions.json');
const MARKETING_DATA_PATH = join(ROOT, 'data', 'marketing.json');

const knowledgeFolders = {
  source: 'sources',
  discussion: 'discussions',
  insight: 'insights',
  topic: 'topics',
  experiment: 'experiments',
  context: 'context-packs',
} as const;

const sourceDefinitions = [
  {
    id: 'requirements',
    title: '需求文档',
    filename: 'requirements.md',
    url: 'https://lumiterra-balance-lab.vercel.app/requirements.md',
  },
  {
    id: 'numeric',
    title: '数值文档',
    filename: 'numeric-core.md',
    url: 'https://lumiterra-balance-lab.vercel.app/numeric-core.md',
  },
] as const;

const memoryFiles = {
  current: 'current.md',
  changelog: 'changelog.md',
  openQuestions: 'open-questions.md',
} as const;

const seedMemory: Record<keyof typeof memoryFiles, string> = {
  current: `# Lumiterra V2 · 当前运营状态

## 当前阶段

V2 仍处于 Early Prototype。现阶段的运营主线是持续理解产品变化，建立稳定叙事，并为后续内容、活动与物料准备可复用上下文。

## 当前工作重点

- 对齐需求文档与数值文档的最新变化
- 区分已确认事实、运营判断与待确认假设
- 沉淀 Agent、Fully Onchain、成长与经济循环的对外表达
- 让每次分析和创作都成为下一次工作的上下文

## 对外表达边界

- 不提前承诺未经确认的上线日期
- 不将仍在调整的数值作为确定卖点
- 不做 Token 收益或结果保证
`,
  changelog: `# 变更记录

> 产品来源、运营判断和重要产出的连续记录。
`,
  openQuestions: `# 待确认问题

- Agent 对玩家最直观、最可感知的价值是什么？
- Fully Onchain 对实际玩法体验意味着什么？
- Energy 应该如何被玩家理解，而不是只被视为成本？
`,
};

type Manifest = {
  lastSyncAt?: string;
  sources?: Record<string, { hash: string; updatedAt: string; url: string }>;
};

export type CreationTurn = {
  id: string;
  instruction: string;
  provider: 'codex' | 'api';
  createdAt: string;
};

export type AssetMetadata = {
  path: string;
  title: string;
  source: 'upload' | 'generated';
  createdAt: string;
  generator?: 'codex' | 'api';
  status?: 'draft' | 'adopted';
  role?: '未分类' | '角色' | '场景' | 'Gameplay' | 'Logo' | '风格' | 'UI';
  usage?: string;
  prompt?: string;
  references?: string[];
  parentPath?: string;
  visualReference?: boolean;
  defaultReference?: boolean;
  groupId?: string;
  version?: number;
  briefPath?: string;
  sessionPath?: string;
  creationSource?: 'independent' | 'content' | 'series';
  linkedContentPaths?: string[];
  seriesName?: string;
  seriesRules?: string;
  threadId?: string;
  apiResponseId?: string;
  conversationTurns?: CreationTurn[];
  conversationSummary?: string;
  knowledgePaths?: string[];
};

export type ContentMetadata = {
  path: string;
  status: 'draft' | 'final' | 'published';
  format: 'post' | 'thread' | 'reply' | 'quote' | 'other';
  language: 'en' | 'zh' | 'bilingual';
  instruction?: string;
  temporaryContext?: string;
  creativeDirection?: string;
  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  publishedAt?: string;
  sourceHashes?: Record<string, string>;
  reviewRequired?: boolean;
  generator?: 'codex' | 'api';
  model?: string;
  apiUsage?: { inputTokens: number; outputTokens: number; cachedTokens: number };
  apiResponseId?: string;
  codexThreadId?: string;
  conversationTurns?: CreationTurn[];
  conversationSummary?: string;
  knowledgePaths?: string[];
  versions?: Array<{
    id: string;
    content: string;
    createdAt: string;
    action: string;
    generator?: 'codex' | 'api';
    model?: string;
    apiUsage?: { inputTokens: number; outputTokens: number; cachedTokens: number };
  }>;
};

export type KnowledgeItemType = keyof typeof knowledgeFolders;
export type KnowledgeStatus = 'inbox' | 'processed' | 'recorded' | 'active' | 'draft' | 'reviewed' | 'adopted' | 'rejected' | 'superseded' | 'proposed' | 'running' | 'completed' | 'stopped' | 'archived';

export type KnowledgeMetadata = {
  id: string;
  type: KnowledgeItemType;
  path: string;
  title: string;
  status: KnowledgeStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
  contentHash: string;
  topicIds: string[];
  tags: string[];
  relatedIds: string[];
  sourceUrl?: string;
  reason?: string;
  supersedesId?: string;
  archivedAt?: string;
};

export type KnowledgeUsage = {
  id: string;
  createdAt: string;
  itemVersions: Array<{ id: string; version: number; contentHash: string }>;
  sourceHashes: Record<string, string>;
  targetPath?: string;
};

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type AssistantSession = {
  id: string;
  kind: 'knowledge' | 'analysis';
  title: string;
  provider: 'codex' | 'api';
  lastProvider?: 'codex' | 'api';
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
  messages: AssistantMessage[];
  knowledgePaths: string[];
  includeSources: boolean;
  apiResponseId?: string;
  codexThreadId?: string;
  outputPath?: string;
};

export type MarketingTimelineItem = {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'active' | 'done';
  notes?: string;
  tags: string[];
  contentPaths: string[];
  assetPaths: string[];
  createdAt: string;
  updatedAt: string;
};

export type MarketingTodo = {
  id: string;
  title: string;
  dueDate?: string;
  status: 'todo' | 'doing' | 'done';
  notes?: string;
  timelineId?: string;
  contentPaths: string[];
  assetPaths: string[];
  createdAt: string;
  updatedAt: string;
};

export type MarketingData = {
  timeline: MarketingTimelineItem[];
  todos: MarketingTodo[];
};

export type WorkspaceFile = {
  path: string;
  name: string;
  kind: string;
  updatedAt: string;
  size: number;
  content?: string;
};

function assertInsideWorkspace(path: string) {
  const resolved = resolve(path);
  const root = resolve(ROOT);
  if (resolved !== root && !resolved.startsWith(`${root}\\`) && !resolved.startsWith(`${root}/`)) {
    throw new Error('非法文件路径');
  }
  return resolved;
}

async function readText(path: string, fallback = '') {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return fallback;
  }
}

async function readManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as Manifest;
  } catch {
    return {};
  }
}

async function readAssetMetadata(): Promise<AssetMetadata[]> {
  try { return JSON.parse(await readFile(ASSET_METADATA_PATH, 'utf8')) as AssetMetadata[]; }
  catch { return []; }
}

async function writeAssetMetadata(entries: AssetMetadata[]) {
  await writeFile(ASSET_METADATA_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function upsertAssetMetadata(entry: AssetMetadata) {
  const entries = await readAssetMetadata();
  const next = [entry, ...entries.filter((item) => item.path !== entry.path)];
  await writeAssetMetadata(next);
}

async function readContentMetadata(): Promise<ContentMetadata[]> {
  try { return JSON.parse(await readFile(CONTENT_METADATA_PATH, 'utf8')) as ContentMetadata[]; }
  catch { return []; }
}

async function writeContentMetadata(entries: ContentMetadata[]) {
  await writeFile(CONTENT_METADATA_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function upsertContentMetadata(entry: ContentMetadata) {
  const entries = await readContentMetadata();
  await writeContentMetadata([entry, ...entries.filter((item) => item.path !== entry.path)]);
}

async function readKnowledgeMetadata(): Promise<KnowledgeMetadata[]> {
  try { return JSON.parse(await readFile(KNOWLEDGE_METADATA_PATH, 'utf8')) as KnowledgeMetadata[]; }
  catch { return []; }
}

async function writeKnowledgeMetadata(entries: KnowledgeMetadata[]) {
  await writeFile(KNOWLEDGE_METADATA_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function readKnowledgeUsage(): Promise<KnowledgeUsage[]> {
  try { return JSON.parse(await readFile(KNOWLEDGE_USAGE_PATH, 'utf8')) as KnowledgeUsage[]; }
  catch { return []; }
}

async function writeKnowledgeUsage(entries: KnowledgeUsage[]) {
  await writeFile(KNOWLEDGE_USAGE_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function readAssistantSessions(): Promise<AssistantSession[]> {
  try { return JSON.parse(await readFile(ASSISTANT_SESSIONS_PATH, 'utf8')) as AssistantSession[]; }
  catch { return []; }
}

async function writeAssistantSessions(entries: AssistantSession[]) {
  await writeFile(ASSISTANT_SESSIONS_PATH, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function readMarketingData(): Promise<MarketingData> {
  try {
    const data = JSON.parse(await readFile(MARKETING_DATA_PATH, 'utf8')) as Partial<MarketingData>;
    return { timeline: Array.isArray(data.timeline) ? data.timeline : [], todos: Array.isArray(data.todos) ? data.todos : [] };
  } catch {
    return { timeline: [], todos: [] };
  }
}

async function writeMarketingData(data: MarketingData) {
  await writeFile(MARKETING_DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function readKnowledgeAliases(): Promise<Record<string, string[]>> {
  try { return JSON.parse(await readFile(KNOWLEDGE_ALIASES_PATH, 'utf8')) as Record<string, string[]>; }
  catch { return {}; }
}

function currentSourceHashes(manifest: Manifest) {
  return Object.fromEntries(Object.entries(manifest.sources ?? {}).map(([id, source]) => [id, source.hash]));
}

async function ensureWorkspace() {
  await Promise.all([
    mkdir(MEMORY_DIR, { recursive: true }),
    mkdir(SOURCES_DIR, { recursive: true }),
    mkdir(join(RECORDS_DIR, 'requests'), { recursive: true }),
    mkdir(join(RECORDS_DIR, 'sessions'), { recursive: true }),
    mkdir(join(RECORDS_DIR, 'decisions'), { recursive: true }),
    mkdir(join(OUTPUTS_DIR, 'documents'), { recursive: true }),
    mkdir(join(OUTPUTS_DIR, 'twitter'), { recursive: true }),
    mkdir(join(OUTPUTS_DIR, 'assets'), { recursive: true }),
    ...Object.values(knowledgeFolders).map((folder) => mkdir(join(KNOWLEDGE_DIR, folder), { recursive: true })),
    mkdir(join(KNOWLEDGE_DIR, 'attachments'), { recursive: true }),
    mkdir(SOURCE_SNAPSHOTS_DIR, { recursive: true }),
    mkdir(KNOWLEDGE_SNAPSHOTS_DIR, { recursive: true }),
    mkdir(join(ROOT, 'data'), { recursive: true }),
  ]);

  for (const [path, fallback] of [[KNOWLEDGE_METADATA_PATH, '[]\n'], [KNOWLEDGE_USAGE_PATH, '[]\n'], [KNOWLEDGE_ALIASES_PATH, '{}\n'], [ASSISTANT_SESSIONS_PATH, '[]\n'], [MARKETING_DATA_PATH, '{\n  "timeline": [],\n  "todos": []\n}\n']] as const) {
    try { await stat(path); }
    catch { await writeFile(path, fallback, 'utf8'); }
  }

  for (const [key, filename] of Object.entries(memoryFiles) as Array<[keyof typeof memoryFiles, string]>) {
    const target = join(MEMORY_DIR, filename);
    try {
      await stat(target);
    } catch {
      await writeFile(target, seedMemory[key], 'utf8');
    }
  }

  const legacyPoster = 'outputs/assets/2026-08-26-lumiterra-v2-fully-onchain-poster.png';
  try {
    await stat(assertInsideWorkspace(join(ROOT, legacyPoster)));
    const entries = await readAssetMetadata();
    if (!entries.some((item) => item.path === legacyPoster)) {
      await writeAssetMetadata([{
        path: legacyPoster,
        title: 'Lumiterra V2 Fully Onchain Poster',
        source: 'generated',
        generator: 'codex',
        status: 'draft',
        createdAt: '2026-08-26T15:25:01.006Z',
        usage: 'Twitter 配图',
        groupId: 'lumiterra-v2-fully-onchain-poster',
        version: 1,
        briefPath: 'outputs/assets/2026-08-26-lumiterra-v2-fully-onchain-poster-brief.md',
        sessionPath: 'records/sessions/2026-08-26-lumiterra-v2-fully-onchain-poster.md',
      }, ...entries]);
    }
  } catch {}
}

async function listFiles(rootDir: string): Promise<WorkspaceFile[]> {
  const result: WorkspaceFile[] = [];
  async function walk(dir: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.toLowerCase() === 'readme.md') continue;
      const fullPath = assertInsideWorkspace(join(dir, entry.name));
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      const info = await stat(fullPath);
      const extension = extname(entry.name).toLowerCase();
      const isText = ['.md', '.txt', '.json'].includes(extension);
      result.push({
        path: relative(ROOT, fullPath).replaceAll('\\', '/'),
        name: basename(entry.name, extension),
        kind: extension.slice(1) || 'file',
        updatedAt: info.mtime.toISOString(),
        size: info.size,
        content: isText ? await readText(fullPath) : undefined,
      });
    }
  }
  await walk(rootDir);
  return result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function recoverUnregisteredGeneratedAssets(outputs: WorkspaceFile[]) {
  const entries = await readAssetMetadata();
  const recoverable = outputs.filter((file) => file.path.startsWith('outputs/assets/') && ['png', 'jpg', 'jpeg', 'webp'].includes(file.kind) && !entries.some((item) => item.path === file.path));
  if (!recoverable.length) return entries;
  const recovered = recoverable.map((file): AssetMetadata => {
    const plainName = file.name.replace(/^\d{4}-\d{2}-\d{2}(?:T\d{2}-\d{2}-\d{2}-\d{3}Z)?-/, '').replaceAll('-', ' ');
    const title = plainName.replace(/\blumiterra\b/i, 'Lumiterra').replace(/\bv2\b/i, 'V2');
    return { path: file.path, title, source: 'generated', generator: 'codex', status: 'draft', createdAt: file.updatedAt, groupId: slugify(title), version: 1 };
  });
  const next = [...recovered, ...entries];
  await writeAssetMetadata(next);
  return next;
}

function knowledgeTypeForPath(path: string): KnowledgeItemType | undefined {
  return (Object.entries(knowledgeFolders) as Array<[KnowledgeItemType, string]>).find(([, folder]) => path.startsWith(`knowledge/${folder}/`))?.[0];
}

function defaultKnowledgeStatus(type: KnowledgeItemType): KnowledgeStatus {
  if (type === 'source') return 'inbox';
  if (type === 'discussion') return 'recorded';
  if (type === 'topic') return 'active';
  if (type === 'experiment') return 'proposed';
  return 'draft';
}

async function recoverKnowledgeMetadata(files: WorkspaceFile[]) {
  const entries = await readKnowledgeMetadata();
  const missing = files.filter((file) => file.kind === 'md' && !entries.some((item) => item.path === file.path));
  if (!missing.length) return entries;
  const recovered = missing.flatMap((file): KnowledgeMetadata[] => {
    const type = knowledgeTypeForPath(file.path);
    if (!type) return [];
    const content = file.content ?? '';
    const hash = createHash('sha256').update(content).digest('hex');
    const embeddedId = content.match(/(?:Knowledge ID|知识 ID)[：:]\s*`?([A-Z]+-[A-Z0-9-]+)`?/i)?.[1];
    const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    return [{
      id: embeddedId ?? `RECOVERED-${hash.slice(0, 12).toUpperCase()}`,
      type,
      path: file.path,
      title: heading ?? file.name.replace(/^\d{4}-\d{2}-\d{2}(?:T[^-]+)?-/, '').replaceAll('-', ' '),
      status: defaultKnowledgeStatus(type),
      createdAt: file.updatedAt,
      updatedAt: file.updatedAt,
      version: 1,
      contentHash: hash,
      topicIds: [],
      tags: [],
      relatedIds: [],
    }];
  });
  const next = [...recovered, ...entries];
  await writeKnowledgeMetadata(next);
  return next;
}

export async function getWorkspace() {
  await ensureWorkspace();
  const manifest = await readManifest();
  const [records, outputs, snapshotFiles, knowledgeFiles] = await Promise.all([listFiles(RECORDS_DIR), listFiles(OUTPUTS_DIR), listFiles(SOURCE_SNAPSHOTS_DIR), listFiles(KNOWLEDGE_DIR)]);
  let contentMetadata = await readContentMetadata();
  const missingTwitterFiles = outputs.filter((file) => file.path.startsWith('outputs/twitter/') && !contentMetadata.some((item) => item.path === file.path));
  if (missingTwitterFiles.length) {
    const sourceHashes = currentSourceHashes(manifest);
    const seeded = missingTwitterFiles.map((file): ContentMetadata => ({ path: file.path, status: 'draft', format: 'post', language: 'en', createdAt: file.updatedAt, updatedAt: file.updatedAt, sourceHashes }));
    contentMetadata = [...seeded, ...contentMetadata];
    await writeContentMetadata(contentMetadata);
  }
  const assetMetadata = await recoverUnregisteredGeneratedAssets(outputs);
  const knowledgeMetadata = await recoverKnowledgeMetadata(knowledgeFiles);
  const sources = await Promise.all(sourceDefinitions.map(async (source) => {
    const path = join(SOURCES_DIR, source.filename);
    const content = await readText(path);
    let updatedAt = manifest.sources?.[source.id]?.updatedAt ?? '';
    if (!updatedAt) {
      try { updatedAt = (await stat(path)).mtime.toISOString(); } catch {}
    }
    return { ...source, content, updatedAt, hash: manifest.sources?.[source.id]?.hash ?? '' };
  }));
  return {
    memory: {
      current: await readText(join(MEMORY_DIR, memoryFiles.current), seedMemory.current),
      changelog: await readText(join(MEMORY_DIR, memoryFiles.changelog), seedMemory.changelog),
      openQuestions: await readText(join(MEMORY_DIR, memoryFiles.openQuestions), seedMemory.openQuestions),
    },
    sources,
    sourceSnapshots: snapshotFiles.map((file) => ({
      ...file,
      sourceId: file.name.endsWith('-requirements') ? 'requirements' : file.name.endsWith('-numeric-core') ? 'numeric' : '',
    })).filter((file) => file.sourceId),
    records,
    outputs,
    assetMetadata,
    contentMetadata,
    knowledgeFiles,
    knowledgeMetadata,
    knowledgeUsage: await readKnowledgeUsage(),
    knowledgeAliases: await readKnowledgeAliases(),
    assistantSessions: await readAssistantSessions(),
    marketing: await readMarketingData(),
    lastSyncAt: manifest.lastSyncAt ?? '',
  };
}

export async function saveMemory(key: keyof typeof memoryFiles, content: string) {
  await ensureWorkspace();
  if (!(key in memoryFiles)) throw new Error('未知记忆文件');
  if (content.length > 500_000) throw new Error('内容过长');
  const path = assertInsideWorkspace(join(MEMORY_DIR, memoryFiles[key]));
  await writeFile(path, content.trimEnd() + '\n', 'utf8');
  return relative(ROOT, path).replaceAll('\\', '/');
}

function slugify(value: string) {
  const latin = value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');
  return (latin || 'untitled').slice(0, 48);
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function knowledgeTitle(content: string, preferred?: string) {
  const explicit = preferred?.trim().slice(0, 120);
  if (explicit) return explicit;
  const firstLine = content.split(/\r?\n/).map((line) => line.replace(/^#+\s*/, '').trim()).find(Boolean) ?? '';
  try {
    const url = new URL(firstLine);
    return `资料：${url.hostname.replace(/^www\./, '')}`;
  } catch {}
  return firstLine.slice(0, 72) || '未命名知识记录';
}

function nextKnowledgeId(type: KnowledgeItemType, entries: KnowledgeMetadata[], now: Date) {
  const prefixes: Record<KnowledgeItemType, string> = { source: 'SRC', discussion: 'DSC', insight: 'INS', topic: 'TOP', experiment: 'EXP', context: 'CTX' };
  const stem = `${prefixes[type]}-${now.toISOString().slice(0, 10).replaceAll('-', '')}-`;
  const currentMax = entries.reduce((max, entry) => entry.id.startsWith(stem) ? Math.max(max, Number(entry.id.slice(stem.length)) || 0) : max, 0);
  return `${stem}${String(currentMax + 1).padStart(3, '0')}`;
}

export async function createKnowledgeItem(input: { type: KnowledgeItemType; title?: string; content: string; reason?: string; tags?: string[]; topicIds?: string[]; relatedIds?: string[] }) {
  await ensureWorkspace();
  if (!(input.type in knowledgeFolders)) throw new Error('未知知识类型');
  const content = input.content.trim().slice(0, 500_000);
  if (!content) throw new Error('请输入需要保存的资料或讨论内容');
  const reason = input.reason?.trim().slice(0, 2_000) || undefined;
  const tags = [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
  const title = knowledgeTitle(content, input.title);
  const now = new Date();
  const createdAt = now.toISOString();
  const entries = await readKnowledgeMetadata();
  const id = nextKnowledgeId(input.type, entries, now);
  const firstLine = content.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? '';
  let sourceUrl: string | undefined;
  if (input.type === 'source') {
    try { sourceUrl = new URL(firstLine).toString(); } catch {}
  }
  const sectionTitle = input.type === 'discussion' ? '讨论内容' : '捕获内容';
  const document = `# ${title}\n\n${reason ? `## 为什么保留\n\n${reason}\n\n` : ''}## ${sectionTitle}\n\n${content}\n`;
  const filename = `${timestampForFile(now)}-${slugify(title)}.md`;
  const target = assertInsideWorkspace(join(KNOWLEDGE_DIR, knowledgeFolders[input.type], filename));
  await writeFile(target, document, 'utf8');
  const path = relative(ROOT, target).replaceAll('\\', '/');
  const metadata: KnowledgeMetadata = {
    id,
    type: input.type,
    path,
    title,
    status: defaultKnowledgeStatus(input.type),
    createdAt,
    updatedAt: createdAt,
    version: 1,
    contentHash: createHash('sha256').update(document).digest('hex'),
    topicIds: [...new Set((input.topicIds ?? []).map((item) => item.trim()).filter(Boolean))].slice(0, 20),
    tags,
    relatedIds: [...new Set((input.relatedIds ?? []).map((item) => item.trim()).filter(Boolean))].slice(0, 40),
    sourceUrl,
    reason,
  };
  await writeKnowledgeMetadata([metadata, ...entries]);
  return { path, metadata };
}

export async function saveAssistantSession(input: {
  id?: string;
  kind: AssistantSession['kind'];
  title?: string;
  provider?: AssistantSession['provider'];
  lastProvider?: AssistantSession['lastProvider'];
  status?: AssistantSession['status'];
  messages?: AssistantMessage[];
  knowledgePaths?: string[];
  includeSources?: boolean;
  apiResponseId?: string;
  codexThreadId?: string;
  outputPath?: string;
}) {
  await ensureWorkspace();
  const entries = await readAssistantSessions();
  const existing = input.id ? entries.find((item) => item.id === input.id) : undefined;
  const now = new Date().toISOString();
  const id = existing?.id ?? (input.id?.trim().slice(0, 120) || crypto.randomUUID());
  const messages = (input.messages ?? existing?.messages ?? []).slice(-30).flatMap((message) => {
    if (!message || (message.role !== 'user' && message.role !== 'assistant')) return [];
    const content = String(message.content ?? '').trim().slice(0, 80_000);
    if (!content) return [];
    return [{ id: String(message.id || crypto.randomUUID()).slice(0, 120), role: message.role, content, createdAt: String(message.createdAt || now).slice(0, 80) } satisfies AssistantMessage];
  });
  const session: AssistantSession = {
    id,
    kind: input.kind,
    title: input.title?.trim().slice(0, 120) || existing?.title || (input.kind === 'analysis' ? '新建分析' : '知识讨论'),
    provider: input.provider ?? existing?.provider ?? 'codex',
    lastProvider: input.lastProvider ?? existing?.lastProvider,
    status: input.status ?? existing?.status ?? 'active',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages,
    knowledgePaths: [...new Set(input.knowledgePaths ?? existing?.knowledgePaths ?? [])].filter((path) => path.startsWith('knowledge/') && path.endsWith('.md')).slice(0, 12),
    includeSources: input.includeSources ?? existing?.includeSources ?? input.kind === 'analysis',
    apiResponseId: input.apiResponseId?.trim().slice(0, 500) || existing?.apiResponseId,
    codexThreadId: input.codexThreadId?.trim().slice(0, 500) || existing?.codexThreadId,
    outputPath: input.outputPath?.trim().slice(0, 500) || existing?.outputPath,
  };
  await writeAssistantSessions([session, ...entries.filter((item) => item.id !== id)].slice(0, 100));
  return session;
}

export async function saveMarketingItem(input: {
  kind: 'timeline' | 'todo';
  id?: string;
  title: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  status?: string;
  notes?: string;
  tags?: string[];
  timelineId?: string;
  contentPaths?: string[];
  assetPaths?: string[];
}) {
  await ensureWorkspace();
  const data = await readMarketingData();
  const title = input.title.trim().slice(0, 160);
  if (!title) throw new Error('请填写事项名称');
  const now = new Date().toISOString();
  const contentPaths = [...new Set(input.contentPaths ?? [])].filter((path) => path.startsWith('outputs/twitter/')).slice(0, 30);
  const assetPaths = [...new Set(input.assetPaths ?? [])].filter((path) => path.startsWith('outputs/assets/')).slice(0, 50);
  if (input.kind === 'timeline') {
    const existing = input.id ? data.timeline.find((item) => item.id === input.id) : undefined;
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(input.startDate ?? '') ? input.startDate as string : now.slice(0, 10);
    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(input.endDate ?? '') && input.endDate! >= startDate ? input.endDate : undefined;
    const status: MarketingTimelineItem['status'] = input.status === 'active' || input.status === 'done' ? input.status : 'planned';
    const item: MarketingTimelineItem = {
      id: existing?.id ?? randomUUID(), title, startDate, endDate, status,
      notes: input.notes?.trim().slice(0, 10_000) || undefined,
      tags: [...new Set((input.tags ?? []).map((tag) => tag.trim()).filter(Boolean))].slice(0, 12),
      contentPaths, assetPaths, createdAt: existing?.createdAt ?? now, updatedAt: now,
    };
    await writeMarketingData({ ...data, timeline: [item, ...data.timeline.filter((entry) => entry.id !== item.id)] });
    return item;
  }
  const existing = input.id ? data.todos.find((item) => item.id === input.id) : undefined;
  const status: MarketingTodo['status'] = input.status === 'doing' || input.status === 'done' ? input.status : 'todo';
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(input.dueDate ?? '') ? input.dueDate : undefined;
  const timelineId = input.timelineId && data.timeline.some((item) => item.id === input.timelineId) ? input.timelineId : undefined;
  const item: MarketingTodo = {
    id: existing?.id ?? randomUUID(), title, dueDate, status,
    notes: input.notes?.trim().slice(0, 10_000) || undefined,
    timelineId, contentPaths, assetPaths, createdAt: existing?.createdAt ?? now, updatedAt: now,
  };
  await writeMarketingData({ ...data, todos: [item, ...data.todos.filter((entry) => entry.id !== item.id)] });
  return item;
}

export async function deleteMarketingItem(kind: 'timeline' | 'todo', id: string) {
  await ensureWorkspace();
  const data = await readMarketingData();
  if (kind === 'timeline') {
    const exists = data.timeline.some((item) => item.id === id);
    if (!exists) throw new Error('Timeline 事项不存在');
    await writeMarketingData({ timeline: data.timeline.filter((item) => item.id !== id), todos: data.todos.map((todo) => todo.timelineId === id ? { ...todo, timelineId: undefined, updatedAt: new Date().toISOString() } : todo) });
  } else {
    if (!data.todos.some((item) => item.id === id)) throw new Error('Todo 不存在');
    await writeMarketingData({ ...data, todos: data.todos.filter((item) => item.id !== id) });
  }
  return { id, kind };
}

export async function recordKnowledgeUsage(input: { knowledgePaths: string[]; targetPath?: string }) {
  await ensureWorkspace();
  const paths = [...new Set(input.knowledgePaths)].filter((path) => path.startsWith('knowledge/') && path.endsWith('.md')).slice(0, 20);
  if (!paths.length) return undefined;
  const [metadata, manifest, entries] = await Promise.all([readKnowledgeMetadata(), readManifest(), readKnowledgeUsage()]);
  const selected = paths.flatMap((path) => {
    const item = metadata.find((entry) => entry.path === path && entry.status !== 'archived');
    return item ? [{ id: item.id, version: item.version, contentHash: item.contentHash }] : [];
  });
  if (!selected.length) return undefined;
  const usage: KnowledgeUsage = {
    id: `USE-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${crypto.randomUUID().slice(0, 6)}`,
    createdAt: new Date().toISOString(),
    itemVersions: selected,
    sourceHashes: currentSourceHashes(manifest),
    targetPath: input.targetPath?.trim().slice(0, 500) || undefined,
  };
  await writeKnowledgeUsage([usage, ...entries].slice(0, 1000));
  return usage;
}

export async function updateKnowledgeStatus(path: string, status: KnowledgeStatus) {
  await ensureWorkspace();
  const normalized = path.replaceAll('\\', '/');
  if (!normalized.startsWith('knowledge/') || !normalized.endsWith('.md')) throw new Error('不能修改这个知识记录');
  const entries = await readKnowledgeMetadata();
  const existing = entries.find((entry) => entry.path === normalized);
  if (!existing) throw new Error('知识记录不存在');
  const now = new Date().toISOString();
  const next: KnowledgeMetadata = { ...existing, status, updatedAt: now, archivedAt: status === 'archived' ? now : undefined };
  await writeKnowledgeMetadata([next, ...entries.filter((entry) => entry.path !== normalized)]);
  return { path: normalized, metadata: next };
}

async function appendChangelog(line: string) {
  const path = join(MEMORY_DIR, memoryFiles.changelog);
  const current = await readText(path, seedMemory.changelog);
  await writeFile(path, `${current.trimEnd()}\n${line}\n`, 'utf8');
}

export async function createRequest(input: {
  kind: 'analysis' | 'creation';
  title: string;
  brief: string;
  outputType?: 'documents' | 'twitter' | 'assets';
}) {
  await ensureWorkspace();
  const title = input.title.trim().slice(0, 120);
  const brief = input.brief.trim().slice(0, 100_000);
  if (!title || !brief) throw new Error('标题和任务说明不能为空');
  const createdAt = new Date().toISOString();
  const filename = `${timestampForFile()}-${slugify(title)}.md`;
  const path = assertInsideWorkspace(join(RECORDS_DIR, 'requests', filename));
  const outputType = input.kind === 'analysis' ? 'documents' : (input.outputType ?? 'documents');
  const content = `# ${title}\n\n- 状态：待处理\n- 类型：${input.kind === 'analysis' ? '分析' : '创作'}\n- 创建时间：${createdAt}\n- 建议产出目录：outputs/${outputType}/\n\n## 任务说明\n\n${brief}\n\n## 执行约束\n\n- 先阅读 AGENTS.md、memory/current.md 和相关 sources/ 文件\n- 明确区分产品事实、运营判断和待确认假设\n- 完成后将产出写入建议目录，并在 records/sessions/ 留下执行记录\n`;
  await writeFile(path, content, 'utf8');
  const relativePath = relative(ROOT, path).replaceAll('\\', '/');
  await appendChangelog(`- ${createdAt} [任务] 新建「${title}」`);
  return {
    path: relativePath,
    codexPrompt: `请处理 ${relativePath}。先读取 AGENTS.md 与 memory/current.md，完成后按文件内约定写入产出和执行记录。`,
  };
}

export async function createRecord(input: { title: string; content: string }) {
  await ensureWorkspace();
  const title = input.title.trim().slice(0, 120);
  const content = input.content.trim().slice(0, 100_000);
  if (!title || !content) throw new Error('标题和记录内容不能为空');
  const createdAt = new Date().toISOString();
  const path = assertInsideWorkspace(join(RECORDS_DIR, 'sessions', `${timestampForFile()}-${slugify(title)}.md`));
  await writeFile(path, `# ${title}\n\n- 记录时间：${createdAt}\n\n${content}\n`, 'utf8');
  const relativePath = relative(ROOT, path).replaceAll('\\', '/');
  await appendChangelog(`- ${createdAt} [记录] ${title}`);
  return { path: relativePath };
}

export async function completeRequest(input: { path: string; outputPath: string; sessionPath: string; provider: 'codex' | 'api' }) {
  await ensureWorkspace();
  const normalized = input.path.replaceAll('\\', '/');
  if (!normalized.startsWith('records/requests/') || !normalized.endsWith('.md')) throw new Error('不能完成这个任务');
  const target = assertInsideWorkspace(join(ROOT, normalized));
  const current = await readText(target, '');
  if (!current) throw new Error('分析任务不存在');
  const resultBlock = [
    '## 执行结果',
    '',
    `- 执行方式：${input.provider === 'api' ? 'OpenAI API' : 'Codex'}`,
    `- 分析产出：${input.outputPath}`,
    `- 执行记录：${input.sessionPath}`,
  ].join('\n');
  const withoutPreviousResult = current.replace(/\n## 执行结果\n[\s\S]*$/, '').trimEnd();
  const completed = withoutPreviousResult
    .replace(/- 状态：(?:待处理|执行中|已完成)/, '- 状态：已完成');
  await writeFile(target, `${completed}\n\n${resultBlock}\n`, 'utf8');
  await appendChangelog(`- ${new Date().toISOString()} [任务完成] ${normalized}`);
  return { path: normalized };
}

export async function cancelRequest(path: string) {
  await ensureWorkspace();
  const normalized = path.replaceAll('\\', '/');
  if (!normalized.startsWith('records/requests/') || !normalized.endsWith('.md')) throw new Error('不能取消这个任务');
  const target = assertInsideWorkspace(join(ROOT, normalized));
  const current = await readText(target, '');
  if (!current) throw new Error('任务不存在');
  if (current.includes('- 状态：已完成')) return { path: normalized, status: 'completed' as const };
  const cancelled = current
    .replace(/- 状态：(?:待处理|执行中|已取消)/, '- 状态：已取消')
    .replace(/\n## 执行状态\n[\s\S]*$/, '')
    .trimEnd();
  await writeFile(target, `${cancelled}\n\n## 执行状态\n\n- 已由用户取消，未保存分析半成品。\n`, 'utf8');
  await appendChangelog(`- ${new Date().toISOString()} [任务取消] ${normalized}`);
  return { path: normalized, status: 'cancelled' as const };
}

const outputCategories = ['documents', 'twitter', 'assets'] as const;
type OutputCategory = typeof outputCategories[number];

export async function saveOutput(input: { category: OutputCategory; title: string; content: string; path?: string }) {
  await ensureWorkspace();
  if (!outputCategories.includes(input.category)) throw new Error('未知内容类型');
  const title = input.title.trim().slice(0, 120);
  const content = input.content.trim().slice(0, 500_000);
  if (!title) throw new Error('标题不能为空');
  let target: string;
  if (input.path) {
    const normalized = input.path.replaceAll('\\', '/');
    if (!normalized.startsWith(`outputs/${input.category}/`) || !normalized.endsWith('.md')) throw new Error('不能修改这个文件');
    target = assertInsideWorkspace(join(ROOT, normalized));
  } else {
    target = assertInsideWorkspace(join(OUTPUTS_DIR, input.category, `${timestampForFile()}-${slugify(title)}.md`));
  }
  await writeFile(target, `# ${title}\n\n${content}\n`, 'utf8');
  const relativePath = relative(ROOT, target).replaceAll('\\', '/');
  if (!input.path) await appendChangelog(`- ${new Date().toISOString()} [产出] ${title}`);
  return { path: relativePath };
}

function contentInternalTitle(content: string) {
  const firstLine = content.split('\n').map((line) => line.replace(/^#+\s*/, '').trim()).find(Boolean) ?? 'Twitter Content';
  return firstLine.replace(/https?:\/\/\S+/g, '').trim().slice(0, 72) || 'Twitter Content';
}

function contentOutputBody(content: string) {
  return content.replace(/^#\s+.*(?:\r?\n)+/, '').trim();
}

export async function saveContent(input: { path?: string; content: string; instruction?: string; temporaryContext?: string; creativeDirection?: string; format?: ContentMetadata['format']; language?: ContentMetadata['language']; status?: ContentMetadata['status']; generator?: ContentMetadata['generator']; model?: string; apiUsage?: ContentMetadata['apiUsage']; apiResponseId?: string; codexThreadId?: string; conversationTurns?: CreationTurn[]; conversationSummary?: string; knowledgePaths?: string[]; versionAction?: string }) {
  await ensureWorkspace();
  const content = input.content.trim().slice(0, 500_000);
  if (!content) throw new Error('内容不能为空');
  const now = new Date().toISOString();
  const entries = await readContentMetadata();
  const normalizedPath = input.path?.replaceAll('\\', '/');
  const existing = normalizedPath ? entries.find((item) => item.path === normalizedPath) : undefined;
  let previousContent = '';
  if (existing && normalizedPath) {
    try { previousContent = contentOutputBody(await readFile(assertInsideWorkspace(join(ROOT, normalizedPath)), 'utf8')); } catch {}
  }
  const title = contentInternalTitle(content);
  const saved = await saveOutput({ category: 'twitter', title, content, path: input.path });
  const manifest = await readManifest();
  const status = input.status ?? existing?.status ?? 'draft';
  const versions = [...(existing?.versions ?? [])];
  if (!versions.length && previousContent) {
    versions.push({
      id: randomUUID(), content: previousContent.slice(0, 500_000), createdAt: existing?.updatedAt ?? existing?.createdAt ?? now,
      action: '此前版本', generator: existing?.generator, model: existing?.model, apiUsage: existing?.apiUsage,
    });
  }
  if (!versions.length || versions.at(-1)?.content.trim() !== content) {
    versions.push({
      id: randomUUID(), content, createdAt: now,
      action: input.versionAction?.trim().slice(0, 240) || (status === 'published' ? '标记已发布' : status === 'final' ? '设为定稿' : existing ? '手动保存' : '首次生成'),
      generator: input.generator ?? existing?.generator,
      model: input.model?.trim().slice(0, 120) || existing?.model,
      apiUsage: input.apiUsage ?? existing?.apiUsage,
    });
  }
  const metadata: ContentMetadata = {
    ...existing,
    path: saved.path,
    status,
    format: input.format ?? existing?.format ?? 'post',
    language: input.language ?? existing?.language ?? 'en',
    instruction: input.instruction?.trim().slice(0, 20_000) || existing?.instruction,
    temporaryContext: input.temporaryContext?.trim().slice(0, 30_000) || existing?.temporaryContext,
    creativeDirection: input.creativeDirection?.trim().slice(0, 800) || existing?.creativeDirection,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    finalizedAt: status === 'final' ? now : existing?.finalizedAt,
    publishedAt: status === 'published' ? now : existing?.publishedAt,
    sourceHashes: currentSourceHashes(manifest),
    reviewRequired: false,
    generator: input.generator ?? existing?.generator,
    model: input.model?.trim().slice(0, 120) || existing?.model,
    apiUsage: input.apiUsage ?? existing?.apiUsage,
    apiResponseId: input.apiResponseId?.trim().slice(0, 500) || existing?.apiResponseId,
    codexThreadId: input.codexThreadId?.trim().slice(0, 500) || existing?.codexThreadId,
    conversationTurns: input.conversationTurns?.slice(-8) ?? existing?.conversationTurns,
    conversationSummary: input.conversationSummary?.trim().slice(-6_000) || existing?.conversationSummary,
    knowledgePaths: [...new Set(input.knowledgePaths ?? existing?.knowledgePaths ?? [])].filter((path) => path.startsWith('knowledge/') && path.endsWith('.md')).slice(0, 12),
    versions: versions.slice(-30),
  };
  await upsertContentMetadata(metadata);
  if (metadata.knowledgePaths?.length) await recordKnowledgeUsage({ knowledgePaths: metadata.knowledgePaths, targetPath: saved.path });
  if (status !== 'draft') await appendChangelog(`- ${now} [内容记忆] ${status === 'published' ? '已发布' : '定稿'}「${title}」`);
  return { path: saved.path, metadata };
}

export async function updateContentStatus(path: string, status: ContentMetadata['status']) {
  await ensureWorkspace();
  const normalized = path.replaceAll('\\', '/');
  if (!normalized.startsWith('outputs/twitter/') || !normalized.endsWith('.md')) throw new Error('不能修改这个内容');
  await stat(assertInsideWorkspace(join(ROOT, normalized)));
  const entries = await readContentMetadata();
  const existing = entries.find((item) => item.path === normalized);
  if (!existing) throw new Error('内容记录不存在');
  const now = new Date().toISOString();
  const manifest = await readManifest();
  const metadata: ContentMetadata = {
    ...existing,
    status,
    updatedAt: now,
    finalizedAt: status === 'final' ? now : existing.finalizedAt,
    publishedAt: status === 'published' ? now : existing.publishedAt,
    sourceHashes: status === 'draft' ? existing.sourceHashes : currentSourceHashes(manifest),
    reviewRequired: status === 'draft' ? existing.reviewRequired : false,
  };
  await upsertContentMetadata(metadata);
  if (status !== 'draft') await appendChangelog(`- ${now} [内容记忆] 标记为${status === 'published' ? '已发布' : '定稿'}：${normalized}`);
  return { path: normalized, metadata };
}

const uploadMimeTypes: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};

export async function uploadAsset(input: { title: string; mimeType: string; data: string }) {
  await ensureWorkspace();
  const title = input.title.trim().slice(0, 120);
  const extension = uploadMimeTypes[input.mimeType];
  if (!title || !extension) throw new Error('不支持的素材格式');
  const buffer = Buffer.from(input.data, 'base64');
  if (!buffer.length || buffer.length > 40 * 1024 * 1024) throw new Error('素材大小不能超过 40MB');
  const target = assertInsideWorkspace(join(OUTPUTS_DIR, 'assets', `${timestampForFile()}-${slugify(title)}${extension}`));
  await writeFile(target, buffer);
  const relativePath = relative(ROOT, target).replaceAll('\\', '/');
  await upsertAssetMetadata({ path: relativePath, title, source: 'upload', createdAt: new Date().toISOString(), role: '未分类' });
  await appendChangelog(`- ${new Date().toISOString()} [素材] 上传 ${title}`);
  return { path: relativePath };
}

export async function saveGeneratedAsset(input: { title: string; data: string; usage?: string; prompt: string; references?: string[]; parentPath?: string; creationSource?: AssetMetadata['creationSource']; linkedContentPaths?: string[]; seriesName?: string; seriesRules?: string; threadId?: string; apiResponseId?: string; conversationTurns?: CreationTurn[]; conversationSummary?: string; knowledgePaths?: string[] }) {
  const saved = await uploadAsset({ title: input.title, mimeType: 'image/png', data: input.data });
  const entries = await readAssetMetadata();
  const parent = input.parentPath ? entries.find((item) => item.path === input.parentPath) : undefined;
  const groupId = parent?.groupId ?? slugify(input.title);
  const version = Math.max(0, ...entries.filter((item) => item.groupId === groupId).map((item) => item.version ?? 1)) + 1;
  const knowledgePaths = [...new Set(input.knowledgePaths ?? [])].filter((path) => path.startsWith('knowledge/') && path.endsWith('.md')).slice(0, 12);
  await upsertAssetMetadata({ path: saved.path, title: input.title, source: 'generated', generator: 'api', status: 'draft', createdAt: new Date().toISOString(), usage: input.usage, prompt: input.prompt, references: input.references ?? [], parentPath: input.parentPath, groupId, version, creationSource: input.creationSource, linkedContentPaths: input.linkedContentPaths ?? [], seriesName: input.seriesName, seriesRules: input.seriesRules, threadId: input.threadId, apiResponseId: input.apiResponseId, conversationTurns: input.conversationTurns?.slice(-8), conversationSummary: input.conversationSummary?.trim().slice(-6_000), knowledgePaths });
  if (knowledgePaths.length) await recordKnowledgeUsage({ knowledgePaths, targetPath: saved.path });
  await appendChangelog(`- ${new Date().toISOString()} [图片生成] ${input.title}`);
  return saved;
}

export async function registerGeneratedAsset(input: { path: string; title: string; usage?: string; prompt?: string; references?: string[]; parentPath?: string; generator?: 'codex' | 'api'; briefPath?: string; sessionPath?: string; creationSource?: AssetMetadata['creationSource']; linkedContentPaths?: string[]; seriesName?: string; seriesRules?: string; threadId?: string; apiResponseId?: string; conversationTurns?: CreationTurn[]; conversationSummary?: string; knowledgePaths?: string[] }) {
  await ensureWorkspace();
  const normalized = input.path.replaceAll('\\', '/');
  if (!normalized.startsWith('outputs/assets/') || !['.png', '.jpg', '.jpeg', '.webp'].includes(extname(normalized).toLowerCase())) throw new Error('不能登记这个素材');
  await stat(assertInsideWorkspace(join(ROOT, normalized)));
  const entries = await readAssetMetadata();
  const existing = entries.find((item) => item.path === normalized);
  const parent = input.parentPath ? entries.find((item) => item.path === input.parentPath) : undefined;
  const title = input.title.trim().slice(0, 120) || existing?.title || basename(normalized, extname(normalized));
  const groupId = existing?.groupId ?? parent?.groupId ?? slugify(title);
  const version = existing?.version ?? Math.max(0, ...entries.filter((item) => item.groupId === groupId).map((item) => item.version ?? 1)) + 1;
  const entry: AssetMetadata = {
    ...existing,
    path: normalized,
    title,
    source: 'generated',
    generator: input.generator ?? 'codex',
    status: existing?.status ?? 'draft',
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    usage: input.usage ?? existing?.usage,
    prompt: input.prompt ?? existing?.prompt,
    references: input.references ?? existing?.references ?? [],
    parentPath: input.parentPath ?? existing?.parentPath,
    groupId,
    version,
    briefPath: input.briefPath ?? existing?.briefPath,
    sessionPath: input.sessionPath ?? existing?.sessionPath,
    creationSource: input.creationSource ?? existing?.creationSource ?? 'independent',
    linkedContentPaths: input.linkedContentPaths ?? existing?.linkedContentPaths ?? [],
    seriesName: input.seriesName ?? existing?.seriesName,
    seriesRules: input.seriesRules ?? existing?.seriesRules,
    threadId: input.threadId ?? existing?.threadId,
    apiResponseId: input.apiResponseId ?? existing?.apiResponseId,
    conversationTurns: input.conversationTurns?.slice(-8) ?? existing?.conversationTurns,
    conversationSummary: input.conversationSummary?.trim().slice(-6_000) || existing?.conversationSummary,
    knowledgePaths: [...new Set(input.knowledgePaths ?? existing?.knowledgePaths ?? [])].filter((path) => path.startsWith('knowledge/') && path.endsWith('.md')).slice(0, 12),
  };
  await upsertAssetMetadata(entry);
  if (entry.knowledgePaths?.length) await recordKnowledgeUsage({ knowledgePaths: entry.knowledgePaths, targetPath: normalized });
  if (!existing) await appendChangelog(`- ${new Date().toISOString()} [图片生成] ${title} · ${entry.generator === 'codex' ? 'Codex' : 'API'} · V${version}`);
  return { path: normalized, metadata: entry };
}

export async function updateAssetMetadata(input: { path: string; title?: string; role?: AssetMetadata['role']; status?: AssetMetadata['status']; visualReference?: boolean; defaultReference?: boolean }) {
  await ensureWorkspace();
  const normalized = input.path.replaceAll('\\', '/');
  if (!normalized.startsWith('outputs/assets/')) throw new Error('不能修改这个素材');
  await stat(assertInsideWorkspace(join(ROOT, normalized)));
  const entries = await readAssetMetadata();
  const existing = entries.find((item) => item.path === normalized);
  const fallback: AssetMetadata = { path: normalized, title: basename(normalized, extname(normalized)), source: 'upload', createdAt: new Date().toISOString(), role: '未分类' };
  const next: AssetMetadata = {
    ...(existing ?? fallback),
    ...(input.title?.trim() ? { title: input.title.trim().slice(0, 120) } : {}),
    ...(input.role ? { role: input.role } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(typeof input.visualReference === 'boolean' ? { visualReference: input.visualReference } : {}),
    ...(typeof input.defaultReference === 'boolean' ? { defaultReference: input.defaultReference } : {}),
  };
  await upsertAssetMetadata(next);
  return { path: normalized, metadata: next };
}

export async function setAssetReference(path: string, visualReference: boolean) {
  await ensureWorkspace();
  const normalized = path.replaceAll('\\', '/');
  if (!normalized.startsWith('outputs/assets/')) throw new Error('不能修改这个素材');
  const entries = await readAssetMetadata();
  const existing = entries.find((item) => item.path === normalized);
  const title = existing?.title ?? basename(normalized, extname(normalized));
  await upsertAssetMetadata({ ...(existing ?? { path: normalized, title, source: 'upload' as const, createdAt: new Date().toISOString() }), visualReference });
  return { path: normalized, visualReference };
}

export async function readAsset(path: string) {
  await ensureWorkspace();
  const normalized = path.replaceAll('\\', '/');
  if (!normalized.startsWith('outputs/assets/')) throw new Error('不能读取这个文件');
  const target = assertInsideWorkspace(join(ROOT, normalized));
  const extension = extname(target).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  };
  const mimeType = mimeTypes[extension];
  if (!mimeType) throw new Error('不支持的素材格式');
  return { data: await readFile(target), mimeType };
}

function lineDiff(before: string, after: string) {
  const oldLines = new Set(before.split('\n').map((line) => line.trim()).filter(Boolean));
  const newLines = new Set(after.split('\n').map((line) => line.trim()).filter(Boolean));
  const addedLines = [...newLines].filter((line) => !oldLines.has(line));
  const removedLines = [...oldLines].filter((line) => !newLines.has(line));
  return {
    added: addedLines.length,
    removed: removedLines.length,
    addedLines,
    removedLines,
  };
}

export async function syncSources(documents: Record<string, string>) {
  await ensureWorkspace();
  const manifest = await readManifest();
  const now = new Date();
  const checkedAt = now.toISOString();
  const nextManifest: Manifest = { lastSyncAt: checkedAt, sources: { ...(manifest.sources ?? {}) } };
  const changes: Array<{ id: string; title: string; changed: boolean; added: number; removed: number; addedLines: string[]; removedLines: string[] }> = [];

  for (const source of sourceDefinitions) {
    const content = documents[source.id];
    if (typeof content !== 'string' || !content.trim()) throw new Error(`${source.title}内容缺失`);
    if (content.length > 5_000_000) throw new Error(`${source.title}内容过长`);
    const path = assertInsideWorkspace(join(SOURCES_DIR, source.filename));
    const before = await readText(path);
    const hash = createHash('sha256').update(content).digest('hex');
    const changed = before !== content;
    const diff = lineDiff(before, content);
    if (changed && before) {
      const snapshot = assertInsideWorkspace(join(SOURCE_SNAPSHOTS_DIR, `${timestampForFile(now)}-${source.filename}`));
      await writeFile(snapshot, before, 'utf8');
    }
    if (changed) await writeFile(path, content, 'utf8');
    nextManifest.sources![source.id] = {
      hash,
      updatedAt: changed ? checkedAt : (manifest.sources?.[source.id]?.updatedAt ?? checkedAt),
      url: source.url,
    };
    changes.push({ id: source.id, title: source.title, changed, ...diff });
  }

  await writeFile(MANIFEST_PATH, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');
  const changedItems = changes.filter((item) => item.changed);
  if (changedItems.length) {
    const changedIds = new Set(changedItems.map((item) => item.id));
    const contentEntries = await readContentMetadata();
    const nextContentEntries = contentEntries.map((entry) => {
      if (entry.status === 'draft') return entry;
      const needsReview = [...changedIds].some((id) => entry.sourceHashes?.[id] !== nextManifest.sources?.[id]?.hash);
      return needsReview ? { ...entry, reviewRequired: true } : entry;
    });
    await writeContentMetadata(nextContentEntries);
    const summary = changedItems.map((item) => `${item.title} +${item.added}/-${item.removed}`).join('；');
    await appendChangelog(`- ${checkedAt} [来源同步] ${summary}`);
  }
  return { checkedAt, changes };
}
