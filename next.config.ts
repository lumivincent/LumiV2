import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Codex SDK resolves a platform-specific CLI binary at runtime. Keeping it
  // external prevents the Next.js server bundle from erasing that package path.
  serverExternalPackages: ['@openai/codex-sdk', '@openai/codex'],
};

export default nextConfig;
