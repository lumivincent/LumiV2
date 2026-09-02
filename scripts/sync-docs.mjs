import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const bundledRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const root = process.env.WORKSPACE_ROOT?.trim() || bundledRoot;
const upstreamDir = join(root, 'sources');
const snapshotDir = join(root, 'snapshots', 'sources');
const manifestPath = join(root, 'data', 'workspace-manifest.json');
const sourceBase = 'https://lumiterra-balance-lab.vercel.app';
const documents = [
  { id: 'requirements', filename: 'requirements.md' },
  { id: 'numeric', filename: 'numeric-core.md' },
  { id: 'agent', filename: 'agent-prototype.js', url: `${sourceBase}/agent-prototype.js?v=20260902-2` },
  { id: 'lottery', filename: 'lottery-prototype.js' },
];
const prototypeAssets = [
  { filename: 'prototype-base.css', url: `${sourceBase}/styles.css?v=20260902-10` },
  { filename: 'agent-prototype.css', url: `${sourceBase}/agent-prototype.css?v=20260902-3` },
  { filename: 'lottery-prototype.css', url: `${sourceBase}/lottery-prototype.css?v=20260901-2` },
];
const run = promisify(execFile);

async function download(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  } catch (error) {
    if (process.platform !== 'win32') throw error;
    const powershell = join(process.env.WINDIR ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const { stdout } = await run(
      powershell,
      ['-NoProfile', '-Command', `[Console]::Out.Write((Invoke-WebRequest -UseBasicParsing '${url}').Content)`],
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
    );
    return stdout;
  }
}

await Promise.all([
  mkdir(upstreamDir, { recursive: true }),
  mkdir(snapshotDir, { recursive: true }),
  mkdir(dirname(manifestPath), { recursive: true }),
]);

let previousManifest = { sources: {} };
try {
  previousManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch {}

const checkedAt = new Date().toISOString();
const stamp = checkedAt.replaceAll(':', '-').replaceAll('.', '-');
const nextManifest = { lastSyncAt: checkedAt, sources: {} };
const downloads = await Promise.all(documents.map(async ({ id, filename, url = `${sourceBase}/${filename}` }) => ({ id, filename, url, content: await download(url) })));
const assetDownloads = await Promise.all(prototypeAssets.map(async ({ filename, url }) => ({ filename, content: await download(url) })));

for (const { id, filename, url, content } of downloads) {
  const hash = createHash('sha256').update(content).digest('hex');
  const previous = previousManifest.sources?.[id];
  const changed = previous?.hash !== hash;
  const localPath = join(upstreamDir, filename);

  if (changed) {
    try {
      const current = await readFile(localPath, 'utf8');
      await writeFile(join(snapshotDir, `${stamp}-${filename}`), current, 'utf8');
    } catch {}
    await writeFile(localPath, content, 'utf8');
  }

  nextManifest.sources[id] = {
    url,
    hash,
    updatedAt: changed ? checkedAt : (previous?.updatedAt ?? checkedAt),
  };
  console.log(`${changed ? 'UPDATED' : 'CURRENT'} ${filename}`);
}

for (const { filename, content } of assetDownloads) {
  await writeFile(join(upstreamDir, filename), content, 'utf8');
  console.log(`CURRENT ${filename}`);
}

await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');
