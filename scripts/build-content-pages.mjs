import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { isMainModule } from './lib/module.mjs';
import { createPageRenderer } from './lib/page-renderer.mjs';
import { escapeHtml, readJson, renderInfoCards } from './lib/render.mjs';

export async function buildContentPages(context) {
  context ??= await createBuildContext();
  const {
    contentDir,
    publicDir,
    site,
    sharedTokens
  } = context;
  const renderPage = createPageRenderer(context);

  // Remove output for routes that no longer exist so stale generated pages are not deployed.
  await fs.rm(path.join(publicDir, 'about'), { recursive: true, force: true });

  const home = await readJson(path.join(contentDir, 'home.json'));
  const homeTags = home.appsSection.featuredTags
    .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
    .join('');

  await renderPage({
    templateName: 'home.html',
    outputPath: 'index.html',
    sourceLabel: 'templates/home.html + content/home.json + content/site.json',
    activePage: 'home',
    footerOptions: { showDomain: true },
    values: {
      TITLE: escapeHtml(home.seo.title),
      META_DESCRIPTION: escapeHtml(home.seo.description),
      OG_TITLE: escapeHtml(home.seo.ogTitle),
      OG_DESCRIPTION: escapeHtml(home.seo.ogDescription),
      HERO_EYEBROW: escapeHtml(home.hero.eyebrow),
      HERO_HEADING: escapeHtml(home.hero.heading),
      HERO_HEADING_ACCENT: escapeHtml(home.hero.headingAccent),
      HERO_DESCRIPTION: escapeHtml(home.hero.description),
      HERO_PRIMARY_ACTION: escapeHtml(home.hero.primaryAction),
      HERO_NOTE: escapeHtml(home.hero.note),
      APPS_EYEBROW: escapeHtml(home.appsSection.eyebrow),
      APPS_HEADING: escapeHtml(home.appsSection.heading),
      APPS_DESCRIPTION: escapeHtml(home.appsSection.description),
      FEATURED_EYEBROW: escapeHtml(home.appsSection.featuredEyebrow),
      FEATURED_APP_SLUG: escapeHtml(home.appsSection.featuredAppSlug),
      FEATURED_APP_NAME: escapeHtml(home.appsSection.featuredAppName),
      FEATURED_DESCRIPTION: escapeHtml(home.appsSection.featuredDescription),
      FEATURED_TAGS: homeTags,
      FEATURED_ACTION: escapeHtml(home.appsSection.featuredAction),
      FEATURED_PREVIEW_PRIMARY: escapeHtml(home.appsSection.previewPrimary),
      FEATURED_PREVIEW_SECONDARY: escapeHtml(home.appsSection.previewSecondary),
      PRINCIPLES_EYEBROW: escapeHtml(home.principlesSection.eyebrow),
      PRINCIPLES_HEADING: escapeHtml(home.principlesSection.heading),
      PRINCIPLE_CARDS: renderInfoCards(home.principlesSection.items),
      ABOUT_STRIP_EYEBROW: escapeHtml(home.aboutStrip.eyebrow),
      ABOUT_STRIP_HEADING: escapeHtml(home.aboutStrip.heading),
      ABOUT_STRIP_DESCRIPTION: escapeHtml(home.aboutStrip.description)
    }
  });

  const support = await readJson(path.join(contentDir, 'support.json'));
  const supportCards = support.cards.map((card) => {
    const icon = card.brandKey
      ? `<img class="app-icon" src="${sharedTokens.APP_PLACEHOLDER_ASSET}?v=${sharedTokens.ASSET_VERSION}" data-brand="${escapeHtml(card.brandKey)}" alt="">`
      : '';
    const link = card.type === 'email'
      ? `<a href="/support/" data-support-email${card.subject ? ` data-support-subject="${escapeHtml(card.subject)}"` : ''}${card.showEmail ? ' data-show-email="true"' : ''}${card.arrow ? ' data-arrow="true"' : ''}>${escapeHtml(card.action)}</a>`
      : `<a href="${escapeHtml(card.href)}">${escapeHtml(card.action)}</a>`;
    return `<article class="support-card">${icon}<h3>${escapeHtml(card.title)}</h3><p class="muted">${escapeHtml(card.description)}</p>${link}</article>`;
  }).join('');

  await renderPage({
    templateName: 'support.html',
    outputPath: 'support/index.html',
    sourceLabel: 'templates/support.html + content/support.json + content/site.json',
    activePage: 'support',
    values: {
      TITLE: escapeHtml(support.seo.title),
      META_DESCRIPTION: escapeHtml(support.seo.description),
      HERO_EYEBROW: escapeHtml(support.hero.eyebrow),
      HERO_HEADING: escapeHtml(support.hero.heading),
      HERO_DESCRIPTION: escapeHtml(support.hero.description),
      SUPPORT_CARDS: supportCards
    }
  });

  const legalIndex = await readJson(path.join(contentDir, 'legal', 'index.json'));
  const legalDocuments = legalIndex.documents
    .map((document) => `<a class="legal-link" href="${escapeHtml(document.href)}"><span><strong>${escapeHtml(document.title)}</strong><small>${escapeHtml(document.description)}</small></span><span aria-hidden="true">→</span></a>`)
    .join('');

  await renderPage({
    templateName: 'legal-index.html',
    outputPath: 'legal/index.html',
    sourceLabel: 'templates/legal-index.html + content/legal/index.json + content/site.json',
    values: {
      TITLE: escapeHtml(legalIndex.seo.title),
      META_DESCRIPTION: escapeHtml(legalIndex.seo.description),
      HERO_EYEBROW: escapeHtml(legalIndex.hero.eyebrow),
      HERO_HEADING: escapeHtml(legalIndex.hero.heading),
      HERO_DESCRIPTION: escapeHtml(legalIndex.hero.description),
      LEGAL_DOCUMENTS: legalDocuments
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
    .filter((file) => file.endsWith('.json') && file !== 'index.json')
    .sort();

  for (const file of legalFiles) {
    const document = await readJson(path.join(contentDir, 'legal', file));
    if (!document.published) continue;

    const sections = document.sections
      .map((section) => `<h2>${escapeHtml(section.heading)}</h2>${(section.paragraphs || []).map(renderLegalParagraph).join('')}`)
      .join('');
    const sideLinks = (document.sideLinks || [])
      .map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`)
      .join('');
    const noticeHtml = document.notice
      ? `<div class="notice"><strong>${escapeHtml(document.notice.label)}</strong> ${escapeHtml(document.notice.text)}</div>`
      : '';

    await renderPage({
      templateName: 'legal-document.html',
      outputPath: document.outputPath,
      sourceLabel: `templates/legal-document.html + content/legal/${file} + content/site.json`,
      values: {
        TITLE: escapeHtml(document.seo.title),
        META_DESCRIPTION: escapeHtml(document.seo.description),
        CANONICAL_PATH: escapeHtml(document.seo.canonicalPath),
        HERO_EYEBROW: escapeHtml(document.hero.eyebrow),
        HERO_HEADING: escapeHtml(document.hero.heading),
        LAST_UPDATED: escapeHtml(document.hero.lastUpdated),
        NOTICE: noticeHtml,
        LEGAL_SECTIONS: sections,
        SIDE_TITLE: escapeHtml(document.sideTitle || site.footer.legalHeading),
        SIDE_LINKS: sideLinks
      }
    });
  }

  const notFound = await readJson(path.join(contentDir, '404.json'));
  await renderPage({
    templateName: '404.html',
    outputPath: '404.html',
    sourceLabel: 'templates/404.html + content/404.json + content/site.json',
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
