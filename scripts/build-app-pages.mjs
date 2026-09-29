import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { isMainModule } from './lib/module.mjs';
import { createPageRenderer } from './lib/page-renderer.mjs';
import { escapeHtml, getAppPresentation, readJson, renderAppCard } from './lib/render.mjs';

export async function buildAppPages(context) {
  context ??= await createBuildContext();
  const {
    appContentDir,
    apps,
    partials,
    site
  } = context;
  const renderPage = createPageRenderer(context);
  const appsIndex = await readJson(path.join(appContentDir, 'index.json'));

  for (const app of apps) {
    const presentation = getAppPresentation(app, site, context.sharedTokens);
    const features = (app.features || [])
      .map((feature, index) => `<article class="app-product-feature"><span class="app-product-feature-number">${String(index + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(feature.title)}</h3><p>${escapeHtml(feature.description)}</p></div></article>`)
      .join('');
    const heroHighlights = (app.features || [])
      .slice(0, 3)
      .map((feature) => `<span>${escapeHtml(feature.title)}</span>`)
      .join('');

    await renderPage({
      templateName: 'app-page.html',
      outputPath: `apps/${app.slug}/index.html`,
      sourceLabel: `src/templates/app-page.html + src/content/apps/${app.slug}.json + src/content/site.json`,
      activePage: 'apps',
      footerOptions: {
        appName: app.name,
        appPrivacyUrl: app.privacyUrl
      },
      values: {
        TITLE: escapeHtml(`${app.name} — ${site.brandName}`),
        META_DESCRIPTION: escapeHtml(app.metaDescription),
        SLUG: escapeHtml(app.slug),
        NAME: escapeHtml(app.name),
        APP_COLOUR: escapeHtml(presentation.colour),
        APP_LOGO_ASSET: escapeHtml(presentation.logoAsset),
        APP_STATUS: presentation.comingSoon
          ? `<span class="app-status">${escapeHtml(site.appUi.comingSoon)}</span>`
          : '',
        HERO_HIGHLIGHTS: heroHighlights,
        ACTION_ALL_APPS: escapeHtml(site.appUi.allApps || 'All Apps'),
        ACTION_EXPLORE_FEATURES: escapeHtml(site.appUi.exploreFeatures || 'Explore Features'),
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

  const appCards = [...apps]
    .sort((a, b) => (a.card?.order ?? Number.MAX_SAFE_INTEGER) - (b.card?.order ?? Number.MAX_SAFE_INTEGER))
    .map((app) => renderAppCard(partials.appCard, app, site, context.sharedTokens))
    .join('');

  await renderPage({
    templateName: 'apps-index.html',
    outputPath: 'apps/index.html',
    sourceLabel: 'src/templates/apps-index.html + src/templates/partials/app-card.html + src/content/apps/index.json + src/content/apps/*.json + src/content/site.json',
    activePage: 'apps',
    values: {
      TITLE: escapeHtml(appsIndex.seo.title),
      META_DESCRIPTION: escapeHtml(appsIndex.seo.description),
      HERO_HEADING: escapeHtml(appsIndex.hero.heading),
      APP_CARDS: appCards
    }
  });

  console.log(`Generated ${apps.length} LifeLoom app page${apps.length === 1 ? '' : 's'} and the apps catalogue from JSON.`);
}

if (isMainModule(import.meta.url)) {
  await buildAppPages();
}
