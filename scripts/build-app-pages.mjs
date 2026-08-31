import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { escapeHtml, readJson, renderFooterAppLinks, replaceTokens } from './lib/render.mjs';

const root = process.cwd();
const appContentDir = path.join(root, 'content', 'apps');
const appTemplatePath = path.join(root, 'templates', 'app-page.html');
const appsIndexTemplatePath = path.join(root, 'templates', 'apps-index.html');
const publicAppsDir = path.join(root, 'public', 'apps');

const site = await readJson(path.join(root, 'content', 'site.json'));
const appsIndex = await readJson(path.join(appContentDir, 'index.json'));

const files = (await fs.readdir(appContentDir))
  .filter((file) => file.endsWith('.json') && file !== 'index.json')
  .sort();

const apps = [];
for (const file of files) {
  const app = await readJson(path.join(appContentDir, file));
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
const footerAppLinks = renderFooterAppLinks(apps);

const shared = {
  BRAND_NAME: escapeHtml(site.brandName),
  SLOGAN: escapeHtml(site.slogan),
  DOMAIN: escapeHtml(site.domain),
  SKIP_TO_CONTENT: escapeHtml(site.navigation.skipToContent),
  NAV_APPS: escapeHtml(site.navigation.apps),
  NAV_ABOUT: escapeHtml(site.navigation.about),
  NAV_SUPPORT: escapeHtml(site.navigation.support),
  NAV_OPEN: escapeHtml(site.navigation.openNavigation),
  FOOTER_APPS_HEADING: escapeHtml(site.footer.appsHeading),
  FOOTER_ALL_APPS: escapeHtml(site.footer.allApps),
  FOOTER_COMPANY_HEADING: escapeHtml(site.footer.companyHeading),
  FOOTER_LEGAL_HEADING: escapeHtml(site.footer.legalHeading),
  FOOTER_LEGAL: escapeHtml(site.footer.legal),
  FOOTER_PRIVACY: escapeHtml(site.footer.privacy),
  FOOTER_LIFELOOM_PRIVACY: escapeHtml(site.footer.lifeLoomPrivacy),
  ACTION_SUPPORT: escapeHtml(site.actions.support),
  ACTION_GET_SUPPORT: escapeHtml(site.actions.getSupport),
  ACTION_PRIVACY_POLICY: escapeHtml(site.actions.privacyPolicy),
  FOOTER_APP_LINKS: footerAppLinks
};

for (const app of apps) {
  const features = (app.features || [])
    .map((feature) => `<article class="feature-item"><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(feature.description)}</p></article>`)
    .join('');

  const values = {
    ...shared,
    TITLE: escapeHtml(`${app.name} — ${site.brandName}`),
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
    PREVIEW_SECONDARY: escapeHtml(app.preview?.secondaryTitle || site.appUi.overview),
    SECTION_EYEBROW: escapeHtml(app.section?.eyebrow),
    SECTION_HEADING: escapeHtml(app.section?.heading),
    SECTION_DESCRIPTION: escapeHtml(app.section?.description),
    FEATURES: features,
    AVAILABILITY_EYEBROW: escapeHtml(app.availability?.eyebrow || site.appUi.availability),
    AVAILABILITY_HEADING: escapeHtml(app.availability?.heading || `Get ${app.name}.`),
    AVAILABILITY_PLACEHOLDER: escapeHtml(app.availability?.placeholder || site.appUi.storePlaceholder),
    AVAILABILITY_ACTIONS: app.availability?.status === 'coming-soon'
      ? `<span class="status-pill">${escapeHtml(site.appUi.comingSoon)}</span>`
      : `<div class="hero-actions"><a class="button button-primary" href="#" data-store-link="${escapeHtml(app.availability?.googlePlayKey || '')}" hidden>${escapeHtml(site.appUi.googlePlay)}</a><a class="button button-primary" href="#" data-store-link="${escapeHtml(app.availability?.appStoreKey || '')}" hidden>${escapeHtml(site.appUi.appStore)}</a></div>`,
    PRIVACY_ACTION: app.privacyUrl
      ? `<a class="button button-secondary" href="${escapeHtml(app.privacyUrl)}">${escapeHtml(site.actions.privacyPolicy)}</a>`
      : '',
    FOOTER_PRIVACY_LINK: app.privacyUrl
      ? `<a href="${escapeHtml(app.privacyUrl)}">${escapeHtml(app.name)} privacy</a>`
      : ''
  };

  const outputDir = path.join(publicAppsDir, app.slug);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, 'index.html'),
    `<!-- Generated from templates/app-page.html + content/apps/${app.slug}.json + content/site.json. Do not edit directly. -->\n${replaceTokens(appTemplate, values)}`
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
    ? `<span class="app-status">${escapeHtml(site.appUi.comingSoon)}</span>`
    : '';

  return `<a class="app-card app-themed" style="${style}" href="/apps/${escapeHtml(app.slug)}/"><img class="app-card-icon" src="/assets/img/brand-placeholder.svg" data-brand="${escapeHtml(app.brandKey)}" alt="">${status}<h2>${escapeHtml(app.name)}</h2><p>${escapeHtml(app.summary)}</p><span class="app-card-arrow" aria-hidden="true">→</span></a>`;
}).join('');

await fs.writeFile(
  path.join(publicAppsDir, 'index.html'),
  `<!-- Generated from templates/apps-index.html + content/apps/index.json + content/apps/*.json + content/site.json. Do not edit directly. -->\n${replaceTokens(appsIndexTemplate, {
    ...shared,
    TITLE: escapeHtml(appsIndex.seo.title),
    META_DESCRIPTION: escapeHtml(appsIndex.seo.description),
    HERO_EYEBROW: escapeHtml(appsIndex.hero.eyebrow),
    HERO_HEADING: escapeHtml(appsIndex.hero.heading),
    HERO_DESCRIPTION: escapeHtml(appsIndex.hero.description),
    APP_CARDS: appCards
  })}`
);

console.log(`Generated ${apps.length} LifeLoom app page${apps.length === 1 ? '' : 's'} and the apps catalogue from JSON.`);
