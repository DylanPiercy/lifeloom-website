import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const appDataDir = path.join(root, 'data', 'apps');
const appTemplatePath = path.join(root, 'templates', 'app-page.html');
const appsIndexTemplatePath = path.join(root, 'templates', 'apps-index.html');
const publicAppsDir = path.join(root, 'public', 'apps');

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const replaceTokens = (template, values) => Object.entries(values).reduce(
  (output, [key, value]) => output.replaceAll(`{{${key}}}`, value),
  template
);

const files = (await fs.readdir(appDataDir))
  .filter((file) => file.endsWith('.json'))
  .sort();

const apps = [];
for (const file of files) {
  const app = JSON.parse(await fs.readFile(path.join(appDataDir, file), 'utf8'));
  if (!/^[a-z0-9-]+$/.test(app.slug || '')) {
    throw new Error(`Invalid app slug in ${file}.`);
  }
  if (!app.name || !app.brandKey) {
    throw new Error(`Missing required app fields in ${file}.`);
  }
  apps.push(app);
}

const appTemplate = await fs.readFile(appTemplatePath, 'utf8');
const appsIndexTemplate = await fs.readFile(appsIndexTemplatePath, 'utf8');

const footerAppLinks = apps
  .map((app) => `<a href="/apps/${escapeHtml(app.slug)}/">${escapeHtml(app.name)}</a>`)
  .join('');

for (const app of apps) {
  const features = (app.features || [])
    .map((feature) => `<article class="feature-item"><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(feature.description)}</p></article>`)
    .join('');

  const values = {
    TITLE: escapeHtml(`${app.name} — LifeLoom`),
    META_DESCRIPTION: escapeHtml(app.metaDescription),
    SLUG: escapeHtml(app.slug),
    BRAND_KEY: escapeHtml(app.brandKey),
    NAME: escapeHtml(app.name),
    HERO_BACKGROUND: escapeHtml(app.theme?.heroBackground || '#111827'),
    HERO_GLOW: escapeHtml(app.theme?.heroGlow || 'rgba(99,102,241,.25)'),
    HERO_TEXT_MUTED: escapeHtml(app.theme?.heroTextMuted || '#d1d5db'),
    HERO_ACCENT: escapeHtml(app.theme?.heroAccent || '#c7d2fe'),
    HERO_EYEBROW: escapeHtml(app.hero?.eyebrow),
    HERO_HEADING: escapeHtml(app.hero?.heading),
    HERO_DESCRIPTION: escapeHtml(app.hero?.description),
    PREVIEW_PRIMARY: escapeHtml(app.preview?.primaryTitle || app.name),
    PREVIEW_SECONDARY: escapeHtml(app.preview?.secondaryTitle || 'Overview'),
    SECTION_EYEBROW: escapeHtml(app.section?.eyebrow),
    SECTION_HEADING: escapeHtml(app.section?.heading),
    SECTION_DESCRIPTION: escapeHtml(app.section?.description),
    FEATURES: features,
    AVAILABILITY_EYEBROW: escapeHtml(app.availability?.eyebrow || 'Availability'),
    AVAILABILITY_HEADING: escapeHtml(app.availability?.heading || `Get ${app.name}.`),
    AVAILABILITY_PLACEHOLDER: escapeHtml(app.availability?.placeholder || 'Store links will appear here when available.'),
    AVAILABILITY_ACTIONS: app.availability?.status === 'coming-soon'
      ? '<span class="status-pill">Coming Soon</span>'
      : `<div class="hero-actions"><a class="button button-primary" href="#" data-store-link="${escapeHtml(app.availability?.googlePlayKey || '')}" hidden>Google Play</a><a class="button button-primary" href="#" data-store-link="${escapeHtml(app.availability?.appStoreKey || '')}" hidden>App Store</a></div>`,
    PRIVACY_ACTION: app.privacyUrl
      ? `<a class="button button-secondary" href="${escapeHtml(app.privacyUrl)}">Privacy policy</a>`
      : '',
    FOOTER_PRIVACY_LINK: app.privacyUrl
      ? `<a href="${escapeHtml(app.privacyUrl)}">${escapeHtml(app.name)} privacy</a>`
      : '',
    FOOTER_APP_LINKS: footerAppLinks
  };

  const outputDir = path.join(publicAppsDir, app.slug);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'index.html'),
    `<!-- Generated from templates/app-page.html and data/apps/${app.slug}.json. Do not edit directly. -->\n${replaceTokens(appTemplate, values)}`
  );
}

const appCards = apps.map((app) => {
  const theme = app.theme || {};
  const style = [
    `--app-card-start:${escapeHtml(theme.cardBackgroundStart || '#1f2937')}`,
    `--app-card-end:${escapeHtml(theme.cardBackgroundEnd || '#111827')}`,
    `--app-card-glow:${escapeHtml(theme.cardGlow || 'rgba(99,102,241,.35)')}`,
    `--app-card-muted:${escapeHtml(theme.cardTextMuted || '#d1d5db')}`
  ].join(';');

  const status = app.availability?.status === 'coming-soon'
    ? '<span class="app-status">Coming Soon</span>'
    : '';

  return `<a class="app-card app-themed" style="${style}" href="/apps/${escapeHtml(app.slug)}/"><img class="app-card-icon" src="/assets/img/brand-placeholder.svg" data-brand="${escapeHtml(app.brandKey)}" alt="">${status}<h2>${escapeHtml(app.name)}</h2><p>${escapeHtml(app.summary)}</p><span class="app-card-arrow" aria-hidden="true">→</span></a>`;
}).join('');

await fs.writeFile(
  path.join(publicAppsDir, 'index.html'),
  `<!-- Generated from templates/apps-index.html and data/apps/*.json. Do not edit directly. -->\n${replaceTokens(appsIndexTemplate, {
    APP_CARDS: appCards,
    FOOTER_APP_LINKS: footerAppLinks
  })}`
);

console.log(`Generated ${apps.length} LifeLoom app page${apps.length === 1 ? '' : 's'} and the apps catalogue.`);
