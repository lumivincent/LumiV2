import { access, cp, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const appRoot = resolve(process.cwd());
const workspaceRoot = resolve(process.env.WORKSPACE_ROOT?.trim() || appRoot);
const seedEntries = ['AGENTS.md', 'memory', 'sources', 'records', 'outputs', 'knowledge', 'snapshots', 'data'];

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

async function prepareStandaloneAssets() {
  const standaloneRoot = join(appRoot, '.next', 'standalone');
  const staticSource = join(appRoot, '.next', 'static');
  const publicSource = join(appRoot, 'public');
  if (await exists(staticSource)) await cp(staticSource, join(standaloneRoot, '.next', 'static'), { recursive: true, force: true });
  if (await exists(publicSource)) await cp(publicSource, join(standaloneRoot, 'public'), { recursive: true, force: true });
}

await initializeWorkspace();
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
