import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const appRoot = resolve(process.cwd());
const workspaceRoot = resolve(process.env.WORKSPACE_ROOT?.trim() || appRoot);
const seedEntries = ['AGENTS.md', 'memory', 'sources', 'records', 'outputs', 'knowledge', 'snapshots', 'data'];
const deploymentSyncManifest = join(appRoot, 'deploy', 'workspace-sync.json');

async function exists(path) {
  try { await access(path); return true; }
  catch { return false; }
}

async function initializeWorkspace() {
  if (workspaceRoot === appRoot) return;
  await mkdir(workspaceRoot, { recursive: true });
  for (const entry of seedEntries) {
    const source = join(appRoot, entry);
    const target = join(workspaceRoot, entry);
    if (!(await exists(source))) {
      if (!entry.includes('.')) await mkdir(target, { recursive: true });
      continue;
    }
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true, force: false, errorOnExist: false });
  }
}

async function applyDeploymentWorkspaceSync() {
  if (workspaceRoot === appRoot || !(await exists(deploymentSyncManifest))) return;

  const manifest = JSON.parse(await readFile(deploymentSyncManifest, 'utf8'));
  const syncId = typeof manifest.id === 'string' ? manifest.id.trim() : '';
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  if (!/^[a-zA-Z0-9._-]+$/.test(syncId)) throw new Error('部署数据同步编号无效');
  if (entries.some((entry) => !seedEntries.includes(entry))) throw new Error('部署数据同步包含不允许的目录');

  const markerDirectory = join(workspaceRoot, '.deployment-sync');
  const markerPath = join(markerDirectory, `${syncId}.json`);
  if (await exists(markerPath)) return;

  const syncRoot = join(appRoot, 'deploy', 'workspace-sync');
  console.log(`[workspace] 正在应用一次性本地数据同步：${syncId}`);
  for (const entry of entries) {
    const source = join(syncRoot, entry);
    if (!(await exists(source))) continue;
    const target = join(workspaceRoot, entry);
    await mkdir(dirname(target), { recursive: true });
    await cp(source, target, { recursive: true, force: true, errorOnExist: false });
  }

  await mkdir(markerDirectory, { recursive: true });
  await writeFile(markerPath, `${JSON.stringify({ id: syncId, appliedAt: new Date().toISOString(), entries }, null, 2)}\n`, 'utf8');
  console.log(`[workspace] 一次性本地数据同步已完成：${syncId}`);
}

async function mergeBundledKnowledgeMetadata() {
  if (workspaceRoot === appRoot) return;
  const bundledPath = join(appRoot, 'data', 'knowledge-metadata.json');
  const persistedPath = join(workspaceRoot, 'data', 'knowledge-metadata.json');
  if (!(await exists(bundledPath)) || !(await exists(persistedPath))) return;

  const bundled = JSON.parse(await readFile(bundledPath, 'utf8'));
  const persisted = JSON.parse(await readFile(persistedPath, 'utf8'));
  if (!Array.isArray(bundled) || !Array.isArray(persisted)) return;

  let changed = false;
  const merged = [...persisted];
  for (const seed of bundled) {
    if (!seed || typeof seed !== 'object') continue;
    const index = merged.findIndex((item) => item && typeof item === 'object' && ((seed.path && item.path === seed.path) || (seed.id && item.id === seed.id)));
    if (index === -1) {
      merged.push(seed);
      changed = true;
      continue;
    }
    const current = merged[index];
    if (seed.path && current.path === seed.path && typeof current.id === 'string' && current.id.startsWith('RECOVERED-')) {
      merged[index] = seed;
      changed = true;
    }
  }

  if (changed) {
    await writeFile(persistedPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
    console.log(`[workspace] 已补充 ${merged.length - persisted.length} 条知识 metadata，并修复自动恢复条目的主题关系`);
  }
}

async function prepareStandaloneAssets() {
  const standaloneRoot = join(appRoot, '.next', 'standalone');
  const staticSource = join(appRoot, '.next', 'static');
  const publicSource = join(appRoot, 'public');
  if (await exists(staticSource)) await cp(staticSource, join(standaloneRoot, '.next', 'static'), { recursive: true, force: true });
  if (await exists(publicSource)) await cp(publicSource, join(standaloneRoot, 'public'), { recursive: true, force: true });
}

await initializeWorkspace();
await applyDeploymentWorkspaceSync();
await mergeBundledKnowledgeMetadata();
await prepareStandaloneAssets();

const serverPath = join(appRoot, '.next', 'standalone', 'server.js');
if (!(await exists(serverPath))) throw new Error('找不到 standalone server，请先运行 pnpm build');

const server = spawn(process.execPath, [serverPath], {
  cwd: appRoot,
  stdio: 'inherit',
  env: { ...process.env, HOSTNAME: '0.0.0.0', PORT: process.env.PORT || '3000' },
});

let shuttingDown = false;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (shuttingDown) return;
    shuttingDown = true;
    server.kill(signal);
    setTimeout(() => process.exit(0), 10_000).unref();
  });
}

server.on('exit', (code, signal) => {
  process.exit(signal ? 0 : (code ?? 1));
});
