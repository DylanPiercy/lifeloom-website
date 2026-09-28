import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { isMainModule } from './lib/module.mjs';
import { createPageRenderer } from './lib/page-renderer.mjs';
import { escapeHtml, readJson } from './lib/render.mjs';

export async function buildAppPages(context) {
  context ??= await createBuildContext();
  const {
    appContentDir,
    apps,
    site,
    sharedTokens
  } = context;
  const renderPage = createPageRenderer(context);
  const appsIndex = await readJson(path.join(appContentDir, 'index.json'));

  for (const app of apps) {
    const features = (app.features || [])
      .map((feature) => `<article class="feature-item"><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(feature.description)}</p></article>`)
      .join('');

    await renderPage({
      templateName: 'app-page.html',
      outputPath: `apps/${app.slug}/index.html`,
      sourceLabel: `templates/app-page.html + content/apps/${app.slug}.json + content/site.json`,
      activePage: 'apps',
      footerOptions: {
        appName: app.name,
        appPrivacyUrl: app.privacyUrl
      },
      values: {
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
          : ''
      }
    });
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

    return `<a class="app-card app-themed" style="${style}" href="/apps/${escapeHtml(app.slug)}/"><img class="app-card-icon" src="${sharedTokens.APP_PLACEHOLDER_ASSET}?v=${sharedTokens.ASSET_VERSION}" data-brand="${escapeHtml(app.brandKey)}" alt="">${status}<h2>${escapeHtml(app.name)}</h2><p>${escapeHtml(app.summary)}</p><span class="app-card-arrow" aria-hidden="true">→</span></a>`;
  }).join('');

  await renderPage({
    templateName: 'apps-index.html',
    outputPath: 'apps/index.html',
    sourceLabel: 'templates/apps-index.html + content/apps/index.json + content/apps/*.json + content/site.json',
    activePage: 'apps',
    values: {
      TITLE: escapeHtml(appsIndex.seo.title),
      META_DESCRIPTION: escapeHtml(appsIndex.seo.description),
      HERO_EYEBROW: escapeHtml(appsIndex.hero.eyebrow),
      HERO_HEADING: escapeHtml(appsIndex.hero.heading),
      HERO_DESCRIPTION: escapeHtml(appsIndex.hero.description),
      APP_CARDS: appCards
    }
  });

  console.log(`Generated ${apps.length} LifeLoom app page${apps.length === 1 ? '' : 's'} and the apps catalogue from JSON.`);
}

if (isMainModule(import.meta.url)) {
  await buildAppPages();
}
