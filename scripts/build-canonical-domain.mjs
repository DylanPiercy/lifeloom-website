import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { isMainModule } from './lib/module.mjs';

export async function buildCanonicalDomain(context) {
  context ??= await createBuildContext();
  const { root, site } = context;
  const outputPath = path.join(root, 'public', 'assets', 'js', 'canonical-domain.js');
  const config = site.canonicalRedirect || {};

  await mkdir(path.dirname(outputPath), { recursive: true });

  if (!config.enabled) {
    await writeFile(outputPath, '/* Canonical-domain redirect disabled. */\n', 'utf8');
    console.log(`Generated ${path.relative(root, outputPath)}`);
    return;
  }

  const canonicalHost = String(config.host || site.domain || '').trim().toLowerCase();
  const redirectHosts = Array.isArray(config.redirectHosts)
    ? config.redirectHosts.map((host) => String(host).trim().toLowerCase()).filter(Boolean)
    : [];

  if (!canonicalHost) {
    throw new Error('content/site.json must define canonicalRedirect.host or domain.');
  }

  const source = `(() => {
  const canonicalHost = ${JSON.stringify(canonicalHost)};
  const redirectHosts = new Set(${JSON.stringify(redirectHosts)});
  const currentHost = window.location.hostname.toLowerCase();

  if (!redirectHosts.has(currentHost) || currentHost === canonicalHost) return;

  const target = new URL(window.location.href);
  target.protocol = 'https:';
  target.hostname = canonicalHost;
  target.port = '';
  window.location.replace(target.toString());
})();
`;

  await writeFile(outputPath, source, 'utf8');
  console.log(`Generated ${path.relative(root, outputPath)}`);
}

if (isMainModule(import.meta.url)) {
  await buildCanonicalDomain();
}
