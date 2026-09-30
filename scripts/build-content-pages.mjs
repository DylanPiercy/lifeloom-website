import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { isMainModule } from './lib/module.mjs';
import { createPageRenderer } from './lib/page-renderer.mjs';
import { escapeHtml, getAppPresentation, readJson, renderAppPlaceholderCards, renderFeaturedAppCard, renderSupportDocumentCards } from './lib/render.mjs';

export async function buildContentPages(context) {
  context ??= await createBuildContext();
  const {
    apps,
    contentDir,
    publicDir,
    site,
    sharedTokens
  } = context;
  const renderPage = createPageRenderer(context);

  // Remove output for routes that no longer exist so stale generated pages are not deployed.
  await fs.rm(path.join(publicDir, 'about'), { recursive: true, force: true });

  const home = await readJson(path.join(contentDir, 'home.json'));
  const featuredApp = apps.find((app) => app.slug === home.appsSection.featuredAppSlug);
  if (!featuredApp) {
    throw new Error(`Homepage featured app not found: ${home.appsSection.featuredAppSlug}`);
  }
  const featuredAppCard = renderFeaturedAppCard(
    context.partials.featuredAppCard,
    context.partials.appExploreButton,
    featuredApp,
    home.appsSection,
    site,
    sharedTokens
  );
  const appPlaceholderCards = renderAppPlaceholderCards(
    context.partials.appPlaceholderCard,
    home.appsSection.placeholderCardCount ?? 3,
    sharedTokens
  );

  await renderPage({
    templateName: 'home.html',
    outputPath: 'index.html',
    sourceLabel: 'src/templates/home.html + src/templates/partials/featured-app-card.html + src/templates/partials/app-explore-button.html + src/templates/partials/app-placeholder-card.html + src/content/home.json + src/content/apps/*.json + src/content/site.json',
    activePage: 'home',
    footerOptions: { showDomain: true },
    values: {
      TITLE: escapeHtml(home.seo.title),
      META_DESCRIPTION: escapeHtml(home.seo.description),
      OG_TITLE: escapeHtml(home.seo.ogTitle),
      OG_DESCRIPTION: escapeHtml(home.seo.ogDescription),
      HERO_HEADING: escapeHtml(home.hero.heading),
      HERO_HEADING_ACCENT: escapeHtml(home.hero.headingAccent),
      HERO_DESCRIPTION: escapeHtml(home.hero.description),
      HERO_PRIMARY_ACTION: escapeHtml(home.hero.primaryAction),
      APPS_EYEBROW: escapeHtml(home.appsSection.eyebrow),
      FEATURED_APP_CARD: featuredAppCard,
      APP_PLACEHOLDER_CARDS: appPlaceholderCards,
      EXPLORE_ALL_APPS_ACTION: escapeHtml(home.appsSection.exploreAllAction),
      ABOUT_STRIP_EYEBROW: escapeHtml(home.aboutStrip.eyebrow),
      ABOUT_STRIP_HEADING: escapeHtml(home.aboutStrip.heading),
      ABOUT_STRIP_DESCRIPTION: escapeHtml(home.aboutStrip.description)
    }
  });

  const support = await readJson(path.join(contentDir, 'support.json'));
  const supportCards = support.cards.map((card) => {
    const supportApp = card.brandKey
      ? apps.find((app) => app.brandKey === card.brandKey)
      : null;
    const supportLogo = supportApp
      ? getAppPresentation(supportApp, site, sharedTokens).logoAsset
      : '';
    const icon = supportLogo
      ? `<img class="app-icon" src="${escapeHtml(supportLogo)}?v=${sharedTokens.ASSET_VERSION}" alt="">`
      : '';
    const link = card.type === 'email'
      ? `<a href="/support/" data-support-email${card.subject ? ` data-support-subject="${escapeHtml(card.subject)}"` : ''}${card.showEmail ? ' data-show-email="true"' : ''}${card.arrow ? ' data-arrow="true"' : ''}>${escapeHtml(card.action)}</a>`
      : `<a href="${escapeHtml(card.href)}">${escapeHtml(card.action)}</a>`;
    return `<article class="support-card">${icon}<h3>${escapeHtml(card.title)}</h3><p class="muted">${escapeHtml(card.description)}</p>${link}</article>`;
  }).join('');

  const supportDocuments = renderSupportDocumentCards(
    context.partials.supportDocumentCard,
    support.documents?.items || [],
    sharedTokens
  );

  await renderPage({
    templateName: 'support.html',
    outputPath: 'support/index.html',
    sourceLabel: 'src/templates/support.html + src/templates/partials/support-document-card.html + src/content/support.json + src/content/site.json',
    activePage: 'support',
    values: {
      TITLE: escapeHtml(support.seo.title),
      META_DESCRIPTION: escapeHtml(support.seo.description),
      HERO_EYEBROW: escapeHtml(support.hero.eyebrow),
      HERO_HEADING: escapeHtml(support.hero.heading),
      HERO_DESCRIPTION: escapeHtml(support.hero.description),
      SUPPORT_CARDS: supportCards,
      DOCUMENTS_EYEBROW: escapeHtml(support.documents?.eyebrow || 'Documents'),
      DOCUMENTS_HEADING: escapeHtml(support.documents?.heading || 'Documents'),
      DOCUMENTS_DESCRIPTION: escapeHtml(support.documents?.description || ''),
      SUPPORT_DOCUMENTS: supportDocuments
    }
  });

  function renderLegalParagraph(paragraph) {
    if (typeof paragraph === 'string') return `<p>${escapeHtml(paragraph)}</p>`;
    const subject = paragraph.supportSubject
      ? ` data-support-subject="${escapeHtml(paragraph.supportSubject)}"`
      : '';
    return `<p>${escapeHtml(paragraph.beforeSupportLink || '')}<a href="/support/" data-support-email data-show-email="true"${subject}>${escapeHtml(paragraph.supportLinkText || 'LifeLoom support')}</a>${escapeHtml(paragraph.afterSupportLink || '')}</p>`;
  }

  const legalFiles = (await fs.readdir(path.join(contentDir, 'legal')))
    .filter((file) => file.endsWith('.json'))
    .sort();

  for (const file of legalFiles) {
    const document = await readJson(path.join(contentDir, 'legal', file));
    if (!document.published) continue;

    const sections = document.sections
      .map((section) => `<h2>${escapeHtml(section.heading)}</h2>${(section.paragraphs || []).map(renderLegalParagraph).join('')}`)
      .join('');
    const noticeHtml = document.notice
      ? `<div class="notice"><strong>${escapeHtml(document.notice.label)}</strong> ${escapeHtml(document.notice.text)}</div>`
      : '';

    await renderPage({
      templateName: 'legal-document.html',
      outputPath: document.outputPath,
      sourceLabel: `src/templates/legal-document.html + src/content/legal/${file} + src/content/site.json`,
      values: {
        TITLE: escapeHtml(document.seo.title),
        META_DESCRIPTION: escapeHtml(document.seo.description),
        CANONICAL_PATH: escapeHtml(document.seo.canonicalPath),
        HERO_EYEBROW: escapeHtml(document.hero.eyebrow),
        HERO_HEADING: escapeHtml(document.hero.heading),
        LAST_UPDATED: escapeHtml(document.hero.lastUpdated),
        NOTICE: noticeHtml,
        LEGAL_SECTIONS: sections
      }
    });
  }

  const notFound = await readJson(path.join(contentDir, '404.json'));
  await renderPage({
    templateName: '404.html',
    outputPath: '404.html',
    sourceLabel: 'src/templates/404.html + src/content/404.json + src/content/site.json',
    values: {
      TITLE: escapeHtml(notFound.seo.title),
      HERO_EYEBROW: escapeHtml(notFound.hero.eyebrow),
      HERO_HEADING: escapeHtml(notFound.hero.heading),
      HERO_DESCRIPTION: escapeHtml(notFound.hero.description),
      HERO_ACTION: escapeHtml(notFound.hero.action),
      HERO_SUPPORT_ACTION: escapeHtml(notFound.hero.supportAction)
    }
  });

  console.log('Generated LifeLoom content pages from JSON.');
}

if (isMainModule(import.meta.url)) {
  await buildContentPages();
}
