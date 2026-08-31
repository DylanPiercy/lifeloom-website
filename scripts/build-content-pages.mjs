import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { escapeHtml, readJson, renderFooterAppLinks, renderInfoCards, replaceTokens } from './lib/render.mjs';

const root = process.cwd();
const contentDir = path.join(root, 'content');
const templatesDir = path.join(root, 'templates');
const publicDir = path.join(root, 'public');

const site = await readJson(path.join(contentDir, 'site.json'));
const appFiles = (await fs.readdir(path.join(contentDir, 'apps')))
  .filter((file) => file.endsWith('.json') && file !== 'index.json')
  .sort();
const apps = await Promise.all(appFiles.map((file) => readJson(path.join(contentDir, 'apps', file))));
const footerAppLinks = renderFooterAppLinks(apps);

const shared = {
  BRAND_NAME: escapeHtml(site.brandName),
  SLOGAN: escapeHtml(site.slogan),
  DOMAIN: escapeHtml(site.domain),
  SKIP_TO_CONTENT: escapeHtml(site.navigation.skipToContent),
  NAV_APPS: escapeHtml(site.navigation.apps),
  NAV_ABOUT: escapeHtml(site.navigation.about),
  NAV_SUPPORT: escapeHtml(site.navigation.support),
  NAV_EXPLORE_APPS: escapeHtml(site.navigation.exploreApps),
  NAV_OPEN: escapeHtml(site.navigation.openNavigation),
  NAV_PRIMARY_ARIA: escapeHtml(site.navigation.primaryAriaLabel),
  FOOTER_APPS_HEADING: escapeHtml(site.footer.appsHeading),
  FOOTER_ALL_APPS: escapeHtml(site.footer.allApps),
  FOOTER_COMPANY_HEADING: escapeHtml(site.footer.companyHeading),
  FOOTER_LEGAL_HEADING: escapeHtml(site.footer.legalHeading),
  FOOTER_LEGAL: escapeHtml(site.footer.legal),
  FOOTER_PRIVACY: escapeHtml(site.footer.privacy),
  FOOTER_LIFELOOM_PRIVACY: escapeHtml(site.footer.lifeLoomPrivacy),
  FOOTER_HOME: escapeHtml(site.footer.home),
  FOOTER_APP_LINKS: footerAppLinks,
  ACTION_ABOUT_LIFELOOM: escapeHtml(site.actions.aboutLifeLoom),
  ACTION_LEARN_MORE: escapeHtml(site.actions.learnMore),
  ACTION_SEE_OUR_APPS: escapeHtml(site.actions.seeOurApps),
  ACTION_SUPPORT: escapeHtml(site.actions.support),
  ACTION_GET_SUPPORT: escapeHtml(site.actions.getSupport),
  ACTION_PRIVACY_POLICY: escapeHtml(site.actions.privacyPolicy),
  LEGAL_LAST_UPDATED_LABEL: escapeHtml(site.legal.lastUpdatedLabel)
};

async function renderPage(templateName, outputPath, values, sourceLabel) {
  const template = await fs.readFile(path.join(templatesDir, templateName), 'utf8');
  const output = replaceTokens(template, { ...shared, ...values });
  const fullOutputPath = path.join(publicDir, outputPath);
  await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
  await fs.writeFile(fullOutputPath, `<!-- Generated from ${sourceLabel}. Do not edit directly. -->\n${output}`);
}

const home = await readJson(path.join(contentDir, 'home.json'));
const homeTags = home.appsSection.featuredTags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
await renderPage('home.html', 'index.html', {
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
}, 'templates/home.html + content/home.json + content/site.json');

const about = await readJson(path.join(contentDir, 'about.json'));
await renderPage('about.html', 'about/index.html', {
  TITLE: escapeHtml(about.seo.title),
  META_DESCRIPTION: escapeHtml(about.seo.description),
  HERO_EYEBROW: escapeHtml(about.hero.eyebrow),
  HERO_HEADING: escapeHtml(about.hero.heading),
  HERO_DESCRIPTION: escapeHtml(about.hero.description),
  PRINCIPLE_CARDS: renderInfoCards(about.principles),
  PRODUCTS_EYEBROW: escapeHtml(about.productsStrip.eyebrow),
  PRODUCTS_HEADING: escapeHtml(about.productsStrip.heading),
  PRODUCTS_DESCRIPTION: escapeHtml(about.productsStrip.description)
}, 'templates/about.html + content/about.json + content/site.json');

const support = await readJson(path.join(contentDir, 'support.json'));
const supportCards = support.cards.map((card) => {
  const icon = card.brandKey ? `<img class="app-icon" src="/assets/img/brand-placeholder.svg" data-brand="${escapeHtml(card.brandKey)}" alt="">` : '';
  const link = card.type === 'email'
    ? `<a href="/support/" data-support-email${card.subject ? ` data-support-subject="${escapeHtml(card.subject)}"` : ''}${card.showEmail ? ' data-show-email="true"' : ''}${card.arrow ? ' data-arrow="true"' : ''}>${escapeHtml(card.action)}</a>`
    : `<a href="${escapeHtml(card.href)}">${escapeHtml(card.action)}</a>`;
  return `<article class="support-card">${icon}<h3>${escapeHtml(card.title)}</h3><p class="muted">${escapeHtml(card.description)}</p>${link}</article>`;
}).join('');
const notice = support.launchNotice;
await renderPage('support.html', 'support/index.html', {
  TITLE: escapeHtml(support.seo.title),
  META_DESCRIPTION: escapeHtml(support.seo.description),
  HERO_EYEBROW: escapeHtml(support.hero.eyebrow),
  HERO_HEADING: escapeHtml(support.hero.heading),
  HERO_DESCRIPTION: escapeHtml(support.hero.description),
  SUPPORT_CARDS: supportCards,
  NOTICE_LABEL: escapeHtml(notice.label),
  NOTICE_BEFORE_CODE: escapeHtml(notice.textBeforeCode),
  NOTICE_CODE: escapeHtml(notice.code),
  NOTICE_AFTER_CODE: escapeHtml(notice.textAfterCode)
}, 'templates/support.html + content/support.json + content/site.json');

const legalIndex = await readJson(path.join(contentDir, 'legal', 'index.json'));
const legalDocuments = legalIndex.documents.map((document) => `<a class="legal-link" href="${escapeHtml(document.href)}"><span><strong>${escapeHtml(document.title)}</strong><small>${escapeHtml(document.description)}</small></span><span aria-hidden="true">→</span></a>`).join('');
await renderPage('legal-index.html', 'legal/index.html', {
  TITLE: escapeHtml(legalIndex.seo.title),
  META_DESCRIPTION: escapeHtml(legalIndex.seo.description),
  HERO_EYEBROW: escapeHtml(legalIndex.hero.eyebrow),
  HERO_HEADING: escapeHtml(legalIndex.hero.heading),
  HERO_DESCRIPTION: escapeHtml(legalIndex.hero.description),
  LEGAL_DOCUMENTS: legalDocuments
}, 'templates/legal-index.html + content/legal/index.json + content/site.json');

function renderLegalParagraph(paragraph) {
  if (typeof paragraph === 'string') return `<p>${escapeHtml(paragraph)}</p>`;
  const subject = paragraph.supportSubject ? ` data-support-subject="${escapeHtml(paragraph.supportSubject)}"` : '';
  return `<p>${escapeHtml(paragraph.beforeSupportLink || '')}<a href="/support/" data-support-email data-show-email="true"${subject}>${escapeHtml(paragraph.supportLinkText || 'LifeLoom support')}</a>${escapeHtml(paragraph.afterSupportLink || '')}</p>`;
}

const legalFiles = (await fs.readdir(path.join(contentDir, 'legal')))
  .filter((file) => file.endsWith('.json') && file !== 'index.json')
  .sort();
for (const file of legalFiles) {
  const document = await readJson(path.join(contentDir, 'legal', file));
  if (!document.published) continue;
  const sections = document.sections.map((section) => `<h2>${escapeHtml(section.heading)}</h2>${(section.paragraphs || []).map(renderLegalParagraph).join('')}`).join('');
  const sideLinks = (document.sideLinks || []).map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('');
  const noticeHtml = document.notice ? `<div class="notice"><strong>${escapeHtml(document.notice.label)}</strong> ${escapeHtml(document.notice.text)}</div>` : '';
  await renderPage('legal-document.html', document.outputPath, {
    TITLE: escapeHtml(document.seo.title),
    META_DESCRIPTION: escapeHtml(document.seo.description),
    CANONICAL_PATH: escapeHtml(document.seo.canonicalPath),
    BRAND_KEY: escapeHtml(document.brandKey || 'lifeloom'),
    HERO_EYEBROW: escapeHtml(document.hero.eyebrow),
    HERO_HEADING: escapeHtml(document.hero.heading),
    LAST_UPDATED: escapeHtml(document.hero.lastUpdated),
    NOTICE: noticeHtml,
    LEGAL_SECTIONS: sections,
    SIDE_TITLE: escapeHtml(document.sideTitle || site.footer.legalHeading),
    SIDE_LINKS: sideLinks
  }, `templates/legal-document.html + content/legal/${file} + content/site.json`);
}

const notFound = await readJson(path.join(contentDir, '404.json'));
await renderPage('404.html', '404.html', {
  TITLE: escapeHtml(notFound.seo.title),
  HERO_EYEBROW: escapeHtml(notFound.hero.eyebrow),
  HERO_HEADING: escapeHtml(notFound.hero.heading),
  HERO_DESCRIPTION: escapeHtml(notFound.hero.description),
  HERO_ACTION: escapeHtml(notFound.hero.action),
  HERO_SUPPORT_ACTION: escapeHtml(notFound.hero.supportAction)
}, 'templates/404.html + content/404.json + content/site.json');

console.log('Generated LifeLoom content pages from JSON.');
