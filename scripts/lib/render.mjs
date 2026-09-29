import { promises as fs } from 'node:fs';

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export const replaceTokens = (template, values) => Object.entries(values).reduce(
  (output, [key, value]) => output.replaceAll(`{{${key}}}`, value ?? ''),
  template
);


export function renderSiteHead(template, sharedTokens) {
  return replaceTokens(template, sharedTokens);
}

export function renderSiteScripts(template, sharedTokens) {
  return replaceTokens(template, sharedTokens);
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

export function renderFooterAppLinks(apps = []) {
  return apps.map((app) => `<a href="/apps/${escapeHtml(app.slug)}/">${escapeHtml(app.name)}</a>`).join('');
}

export function renderSiteHeader(template, site, sharedTokens, activePage = '') {
  return replaceTokens(template, {
    ...sharedTokens,
    NAV_HOME_CURRENT: activePage === 'home' ? ' aria-current="page"' : '',
    NAV_SUPPORT_CURRENT: activePage === 'support' ? ' aria-current="page"' : '',
    NAV_APPS_CURRENT: activePage === 'apps' ? ' aria-current="page"' : ''
  });
}


export function getAppPresentation(app, site, sharedTokens) {
  const card = app.card || {};

  return {
    colour: String(card.colour || site.appUi?.defaultCardColour || '#8178ff').trim(),
    comingSoon: card.comingSoon === true,
    logoAsset: String(card.logo || sharedTokens.APP_PLACEHOLDER_ASSET).trim()
  };
}

export function renderAppCard(template, app, site, sharedTokens) {
  const { colour, comingSoon, logoAsset } = getAppPresentation(app, site, sharedTokens);
  const highlights = (app.features || [])
    .slice(0, 3)
    .map((feature) => `<span>${escapeHtml(feature.title)}</span>`)
    .join('');

  return replaceTokens(template, {
    ...sharedTokens,
    APP_SLUG: escapeHtml(app.slug),
    APP_NAME: escapeHtml(app.name),
    APP_SUMMARY: escapeHtml(app.summary),
    APP_EYEBROW: escapeHtml(app.hero?.eyebrow || site.appUi?.appEyebrow || 'A LifeLoom app'),
    APP_BRAND_KEY: escapeHtml(app.brandKey),
    APP_COLOUR: escapeHtml(colour),
    APP_LOGO_ASSET: escapeHtml(logoAsset),
    APP_HIGHLIGHTS: highlights,
    APP_ACTION_LABEL: escapeHtml(site.appUi.viewApp || 'Explore App'),
    APP_STATUS: comingSoon
      ? `<span class="app-status">${escapeHtml(site.appUi.comingSoon)}</span>`
      : ''
  });
}

export function renderSiteFooter(template, site, apps, sharedTokens, options = {}) {
  const legalLinks = options.appPrivacyUrl
    ? `<a href="${escapeHtml(options.appPrivacyUrl)}">${escapeHtml(options.appName)} privacy</a><a href="/legal/privacy/">${escapeHtml(site.footer.lifeLoomPrivacy)}</a>`
    : `<a href="/legal/">${escapeHtml(site.footer.legal)}</a><a href="/legal/privacy/">${escapeHtml(site.footer.privacy)}</a>`;

  return replaceTokens(template, {
    ...sharedTokens,
    FOOTER_APPS_HEADING: escapeHtml(site.footer.appsHeading),
    FOOTER_ALL_APPS: escapeHtml(site.footer.allApps),
    FOOTER_APP_LINKS: renderFooterAppLinks(apps),
    FOOTER_SUPPORT_HEADING: escapeHtml(site.footer.supportHeading),
    FOOTER_LEGAL_HEADING: escapeHtml(site.footer.legalHeading),
    FOOTER_LEGAL_LINKS: legalLinks,
    FOOTER_BOTTOM_EXTRA: options.showDomain ? `<span>${escapeHtml(site.domain)}</span>` : ''
  });
}
