import { Codex } from '@openai/codex-sdk';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';
import { getCACertificates } from 'node:tls';
import { openAIProxyUrl } from '@/lib/openai-fetch';
import { cancelRequest, completeRequest, createRecord, getWorkspace, saveOutput } from '@/lib/workspace-store';

const ROOT = resolve(/* turbopackIgnore: true */ process.env.WORKSPACE_ROOT?.trim() || process.cwd());
const OUTPUTS_DIR = join(ROOT, 'outputs');

export type CodexResultFile = {
  path: string;
  name: string;
  content: string;
  updatedAt: string;
};

export type CodexRun = {
  id: string;
  requestPath: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  threadId?: string;
  finalResponse?: string;
  error?: string;
  phase?: 'queued' | 'working' | 'result-ready' | 'completed' | 'cancelled';
  lane?: 'text' | 'image';
  resultFiles: CodexResultFile[];
};

type RunStore = Map<string, CodexRun>;
type BaselineStore = Map<string, Map<string, number>>;
type ControllerStore = Map<string, AbortController>;

const globalStore = globalThis as typeof globalThis & { __lumiterraCodexRuns?: RunStore; __lumiterraCodexBaselines?: BaselineStore; __lumiterraCodexControllers?: ControllerStore };
const runs = globalStore.__lumiterraCodexRuns ?? new Map<string, CodexRun>();
const baselines = globalStore.__lumiterraCodexBaselines ?? new Map<string, Map<string, number>>();
const controllers = globalStore.__lumiterraCodexControllers ?? new Map<string, AbortController>();
globalStore.__lumiterraCodexRuns = runs;
globalStore.__lumiterraCodexBaselines = baselines;
globalStore.__lumiterraCodexControllers = controllers;

function requestTitle(content: string) {
  return content.split('\n').find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim() || '运营分析';
}

function boundedSourceContext(sources: Array<{ title: string; content: string }>) {
  let remaining = 90_000;
  return sources.map((source) => {
    if (remaining <= 0) return '';
    const content = source.content.slice(0, remaining);
    remaining -= content.length;
    return `【产品源文档：${source.title}】\n${content}`;
  }).filter(Boolean).join('\n\n');
}

function workspacePath(input: string) {
  const normalized = input.replaceAll('\\', '/');
  if (!normalized.startsWith('records/requests/') || !normalized.endsWith('.md')) {
    throw new Error('只能执行工作台创建的任务');
  }
  const target = resolve(ROOT, normalized);
  if (!target.startsWith(`${ROOT}\\`) && !target.startsWith(`${ROOT}/`)) throw new Error('非法任务路径');
  return { normalized, target };
}

async function outputSnapshot() {
  const files = new Map<string, number>();
  async function walk(directory: string) {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else files.set(relative(ROOT, path).replaceAll('\\', '/'), (await stat(path)).mtimeMs);
    }
  }
  await walk(OUTPUTS_DIR);
  return files;
}

async function changedOutputs(before: Map<string, number>, lane: 'text' | 'image' = 'text') {
  const after = await outputSnapshot();
  const changed = [...after.entries()]
    .filter(([path, modified]) => modified > (before.get(path) ?? 0))
    .filter(([path]) => lane === 'image' ? path.startsWith('outputs/assets/') : !/\.(png|jpe?g|webp)$/i.test(path))
    .sort((a, b) => b[1] - a[1]);
  const result: CodexResultFile[] = [];
  for (const [path] of changed) {
    const extension = extname(path).toLowerCase();
    if (!['.md', '.txt', '.png', '.jpg', '.jpeg', '.webp'].includes(extension)) continue;
    const target = resolve(ROOT, path);
    result.push({
      path,
      name: basename(path, extname(path)),
      content: ['.md', '.txt'].includes(extension) ? await readFile(target, 'utf8') : '',
      updatedAt: (await stat(target)).mtime.toISOString(),
    });
  }
  return result;
}

async function execute(run: CodexRun, signal: AbortSignal, requestTarget?: string, resumeThreadId?: string, directPrompt?: string) {
  const before = await outputSnapshot();
  baselines.set(run.id, before);
  run.status = 'running';
  run.phase = 'working';
  try {
    if (requestTarget) await stat(requestTarget);
    const requestContent = directPrompt ?? (requestTarget ? await readFile(requestTarget, 'utf8') : '');
    const directTextTask = run.lane === 'text' && Boolean(directPrompt);
    const directImageTask = run.lane === 'image' && (Boolean(directPrompt) || requestContent.includes('创作动作：直接生成图片'));
    const selfContainedAnalysis = run.lane === 'text' && !directPrompt && /- 类型：分析/.test(requestContent);
    const workspace = selfContainedAnalysis ? await getWorkspace() : undefined;
    const inheritedEnv = Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    );
    const standaloneEnv = Object.fromEntries(
      Object.entries(inheritedEnv).filter(([name]) => !name.startsWith('CODEX_')),
    );
    const codexRuntimeRoot = join(ROOT, 'work', 'codex-runtime');
    const codexHome = join(codexRuntimeRoot, 'home');
    const codexSqliteHome = join(codexRuntimeRoot, 'sqlite');
    const codexRolloutRoot = join(codexRuntimeRoot, 'sessions');
    const codexHomeDrive = /^[A-Za-z]:/.exec(codexHome)?.[0];
    const configuredCa = inheritedEnv.LUMITERRA_CODEX_CA_CERTIFICATE
      || inheritedEnv.CODEX_CA_CERTIFICATE
      || inheritedEnv.SSL_CERT_FILE;
    const codexCaBundle = configuredCa ? resolve(configuredCa) : join(codexRuntimeRoot, 'ca-bundle.pem');
    const codexProxy = inheritedEnv.LUMITERRA_CODEX_PROXY
      || inheritedEnv.HTTPS_PROXY
      || inheritedEnv.HTTP_PROXY
      || openAIProxyUrl();
    await Promise.all([
      mkdir(codexHome, { recursive: true }),
      mkdir(codexSqliteHome, { recursive: true }),
      mkdir(codexRolloutRoot, { recursive: true }),
    ]);
    if (configuredCa) {
      await stat(codexCaBundle).catch(() => {
        throw new Error(`Codex CA 证书文件不存在：${codexCaBundle}`);
      });
    } else {
      const certificates = [...new Set([
        ...getCACertificates('default'),
        ...getCACertificates('system'),
      ])];
      if (!certificates.length) throw new Error('无法读取本机 CA 证书，请配置 LUMITERRA_CODEX_CA_CERTIFICATE');
      await writeFile(codexCaBundle, `${certificates.join('\n')}\n`, 'utf8');
    }
    const codex = new Codex({
      apiKey: inheritedEnv.CODEX_API_KEY || inheritedEnv.OPENAI_API_KEY,
      config: { default_permissions: 'lumiterra_workbench' },
      configOverrides: [
        'permissions.lumiterra_workbench.extends=":workspace"',
      ],
      env: {
        ...standaloneEnv,
        HOME: codexHome,
        USERPROFILE: codexHome,
        ...(codexHomeDrive ? {
          HOMEDRIVE: codexHomeDrive,
          HOMEPATH: codexHome.slice(codexHomeDrive.length),
        } : {}),
        CODEX_HOME: codexHome,
        CODEX_SQLITE_HOME: codexSqliteHome,
        CODEX_ROLLOUT_TRACE_ROOT: codexRolloutRoot,
        CODEX_CA_CERTIFICATE: codexCaBundle,
        ...(codexProxy ? {
          HTTP_PROXY: codexProxy,
          HTTPS_PROXY: codexProxy,
          ALL_PROXY: codexProxy,
        } : {}),
      },
    });
    const threadOptions = {
      workingDirectory: ROOT,
      skipGitRepoCheck: true,
      approvalPolicy: 'never',
      webSearchMode: 'disabled',
    } as const;
    const thread = resumeThreadId ? codex.resumeThread(resumeThreadId, threadOptions) : codex.startThread(threadOptions);
    run.threadId = thread.id ?? resumeThreadId;
    const prompt = selfContainedAnalysis && workspace
      ? [
        '完成下面的 Lumiterra V2 运营分析。所有必要资料已经完整提供，本次禁止调用任何本地工具、命令、文件读取或补丁工具。',
        '只返回最终中文 Markdown 分析正文，不重复标题，不描述过程。',
        '严格区分：已确认产品事实、运营解释或建议、仍需团队确认的假设。',
        '回答任务提出的全部问题，重点说明变化、影响、风险和需要调整的公开表达。',
        '不得把未确认日期、数值、经济结果或 Token 回报写成公开承诺。',
        `【本次分析任务】\n${requestContent.slice(0, 100_000)}`,
        `【当前项目记忆】\n${workspace.memory.current.slice(0, 12_000)}`,
        boundedSourceContext(workspace.sources),
      ].filter(Boolean).join('\n\n')
      : directTextTask
      ? directPrompt!
      : directPrompt
      ? `继续当前图片创作。只执行下面这次调整，读取其中列出的本地参考图片，并调用 ImageGen 生成一个新版本保存到 outputs/assets/。不要创建任务文件、创作说明或执行记录；不要重新读取完整产品文档。\n\n${directPrompt}`
      : directImageTask
      ? `请处理 ${run.requestPath}。这是直接图片生成任务：先读取 AGENTS.md、memory/current.md、任务文件和其中列出的参考图片；只有画面涉及具体产品事实时才读取对应 sources/ 片段，不需要完整读取大型数值文档。优先调用 ImageGen 并把最终图片保存到 outputs/assets/，图片保存后再补充简短创作说明、任务状态和 records/sessions/ 执行记录。不要等待用户补充。`
      : `请处理 ${run.requestPath}。严格遵守 AGENTS.md：先读取 memory/current.md 和相关 sources/，完成任务文件约定的产出、任务状态更新和 records/sessions/ 执行记录。直接完成可在本地完成的工作，不要等待用户补充；无法确认的内容明确列为待确认项。`;
    const turn = await thread.run(prompt, { signal });
    if (signal.aborted) return;
    run.threadId = thread.id ?? resumeThreadId;
    run.finalResponse = turn.finalResponse;
    if (selfContainedAnalysis) {
      const content = turn.finalResponse?.trim();
      if (!content) throw new Error('Codex 没有返回分析内容');
      const title = requestTitle(requestContent);
      const output = await saveOutput({ category: 'documents', title, content });
      const usedSources = workspace?.sources.map((source) => `- sources/${source.filename}`).join('\n') || '- 无';
      const session = await createRecord({
        title: `${title} · Codex 执行`,
        content: [
          '- 执行方式：Codex',
          `- Codex 任务：${run.threadId || '未返回'}`,
          `- 分析任务：${run.requestPath}`,
          `- 分析产出：${output.path}`,
          '',
          '## 使用资料',
          '',
          '- memory/current.md',
          usedSources,
          '',
          '## 重要判断',
          '',
          '- 工作台读取本地资料并负责结果落盘；Codex 基于所提供资料生成分析正文。',
          '- 产品事实、运营建议和待确认信息已在分析正文中分开。',
          '',
          '## 剩余问题',
          '',
          '- 见分析产出中的待确认部分。',
        ].join('\n'),
      });
      await completeRequest({ path: run.requestPath, outputPath: output.path, sessionPath: session.path, provider: 'codex' });
    }
    run.resultFiles = await changedOutputs(before, run.lane);
    if (directTextTask && !turn.finalResponse?.trim()) {
      throw new Error('Codex 没有返回对话内容');
    }
    if (!run.resultFiles.length && !directTextTask) {
      throw new Error(turn.finalResponse?.trim() || 'Codex 执行结束，但没有生成任何结果文件');
    }
    run.status = 'completed';
    run.phase = 'completed';
  } catch (error) {
    if (signal.aborted) {
      run.status = 'cancelled';
      run.phase = 'cancelled';
      run.error = '任务已取消';
      return;
    }
    run.status = 'failed';
    run.error = error instanceof Error ? error.message : 'Codex 执行失败';
  } finally {
    run.completedAt = new Date().toISOString();
    controllers.delete(run.id);
  }
}

export function startCodexRun(requestPath: string, threadId?: string, lane: 'text' | 'image' = 'text', directPrompt?: string) {
  const active = [...runs.values()].find((run) => (run.status === 'queued' || run.status === 'running') && (run.lane ?? 'text') === lane);
  if (active) throw new Error(lane === 'image' ? '已有图片任务正在执行，请等待完成' : '已有文字任务正在执行，请等待完成');
  if (directPrompt && lane === 'image' && !threadId) throw new Error('轻量继续创作需要已有图片会话');
  const boundedPrompt = directPrompt?.trim().slice(0, 30_000);
  const resolved = boundedPrompt ? { normalized: `direct:${lane}-conversation`, target: undefined } : workspacePath(requestPath);
  const id = crypto.randomUUID();
  const run: CodexRun = {
    id,
    requestPath: resolved.normalized,
    status: 'queued',
    startedAt: new Date().toISOString(),
    phase: 'queued',
    lane,
    resultFiles: [],
  };
  runs.set(id, run);
  const controller = new AbortController();
  controllers.set(id, controller);
  void execute(run, controller.signal, resolved.target, threadId?.trim() || undefined, boundedPrompt);
  return run;
}

export async function cancelCodexRun(id: string) {
  const run = runs.get(id);
  if (!run) throw new Error('未找到这次任务，服务可能已重启');
  if (run.phase === 'cancelled') {
    run.status = 'cancelled';
    run.error = '任务已取消';
    return run;
  }
  if (run.status !== 'queued' && run.status !== 'running') return run;
  controllers.get(id)?.abort();
  run.status = 'cancelled';
  run.phase = 'cancelled';
  run.error = '任务已取消';
  run.completedAt = new Date().toISOString();
  if (run.requestPath.startsWith('records/requests/')) await cancelRequest(run.requestPath);
  return run;
}

export async function getCodexRun(id: string) {
  const run = runs.get(id);
  const baseline = baselines.get(id);
  if (run && baseline && (run.status === 'queued' || run.status === 'running')) {
    run.resultFiles = await changedOutputs(baseline, run.lane);
    if (run.resultFiles.some((file) => /\.(png|jpe?g|webp)$/i.test(file.path))) run.phase = 'result-ready';
  }
  return run;
}
