import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const sitePath = path.join(root, 'content', 'site.json');
const outputPath = path.join(root, 'public', 'assets', 'js', 'canonical-domain.js');

const site = JSON.parse(await readFile(sitePath, 'utf8'));
const config = site.canonicalRedirect || {};

if (!config.enabled) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, '/* Canonical-domain redirect disabled. */\n', 'utf8');
  process.exit(0);
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

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, source, 'utf8');
console.log(`Generated ${path.relative(root, outputPath)}`);
