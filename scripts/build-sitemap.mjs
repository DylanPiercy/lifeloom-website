import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { isMainModule } from './lib/module.mjs';
import { readJson } from './lib/render.mjs';

function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function normaliseRoute(route) {
  const value = String(route || '').trim();
  if (!value) return '';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash === '/' || withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

function routeFromOutputPath(outputPath) {
  const value = String(outputPath || '').trim().replaceAll('\\', '/');
  if (!value) return '';
  if (value === 'index.html') return '/';
  if (value.endsWith('/index.html')) {
    return normaliseRoute(value.slice(0, -'index.html'.length));
  }
  return normaliseRoute(value.replace(/\.html$/i, ''));
}

async function getPublishedLegalRoutes(contentDir) {
  const legalDir = path.join(contentDir, 'legal');
  const files = (await fs.readdir(legalDir))
    .filter((file) => file.endsWith('.json'))
    .sort();

  const routes = [];
  for (const file of files) {
    const document = await readJson(path.join(legalDir, file));
    if (!document.published) continue;

    const route = normaliseRoute(document.seo?.canonicalPath)
      || routeFromOutputPath(document.outputPath);
    if (!route) {
      throw new Error(`Published legal document ${file} must define seo.canonicalPath or outputPath.`);
    }
    routes.push(route);
  }

  return routes;
}

export async function buildSitemap(context) {
  context ??= await createBuildContext();
  const { apps, contentDir, publicDir, site } = context;
  const domain = String(site.domain || '').trim();
  if (!domain) {
    throw new Error('src/content/site.json must define domain before generating sitemap.xml.');
  }

  const legalRoutes = await getPublishedLegalRoutes(contentDir);
  const routes = [
    '/',
    '/apps/',
    ...apps.map((app) => `/apps/${app.slug}/`),
    '/support/',
    ...legalRoutes
  ];

  const uniqueRoutes = [...new Set(routes.map(normaliseRoute).filter(Boolean))];
  const baseUrl = `https://${domain}`;
  const entries = uniqueRoutes
    .map((route) => `  <url><loc>${escapeXml(`${baseUrl}${route}`)}</loc></url>`)
    .join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`Generated sitemap.xml with ${uniqueRoutes.length} URL${uniqueRoutes.length === 1 ? '' : 's'}.`);
}

if (isMainModule(import.meta.url)) {
  await buildSitemap();
}
