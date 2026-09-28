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


export function renderSiteHead(template, assetVersion) {
  return replaceTokens(template, {
    ASSET_VERSION: escapeHtml(assetVersion)
  });
}

export function renderSiteScripts(template, assetVersion) {
  return replaceTokens(template, {
    ASSET_VERSION: escapeHtml(assetVersion)
  });
}

export async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

export function renderInfoCards(items = []) {
  return items.map((item) => `<article class="info-card"><div class="info-number">${escapeHtml(item.number)}</div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></article>`).join('');
}

export function renderFooterAppLinks(apps = []) {
  return apps.map((app) => `<a href="/apps/${escapeHtml(app.slug)}/">${escapeHtml(app.name)}</a>`).join('');
}

export function renderSiteHeader(template, site, assetVersion, activePage = '') {
  return replaceTokens(template, {
    ASSET_VERSION: escapeHtml(assetVersion),
    BRAND_NAME: escapeHtml(site.brandName),
    SKIP_TO_CONTENT: escapeHtml(site.navigation.skipToContent),
    NAV_HOME: escapeHtml(site.navigation.home),
    NAV_SUPPORT: escapeHtml(site.navigation.support),
    NAV_EXPLORE_APPS: escapeHtml(site.navigation.exploreApps),
    NAV_OPEN: escapeHtml(site.navigation.openNavigation),
    NAV_PRIMARY_ARIA: escapeHtml(site.navigation.primaryAriaLabel),
    THEME_LIGHT_LABEL: escapeHtml(site.navigation.switchToLightMode),
    THEME_DARK_LABEL: escapeHtml(site.navigation.switchToDarkMode),
    NAV_HOME_CURRENT: activePage === 'home' ? ' aria-current="page"' : '',
    NAV_SUPPORT_CURRENT: activePage === 'support' ? ' aria-current="page"' : '',
    NAV_APPS_CURRENT: activePage === 'apps' ? ' aria-current="page"' : ''
  });
}
export function renderSiteFooter(template, site, apps, assetVersion, options = {}) {
  const legalLinks = options.appPrivacyUrl
    ? `<a href="${escapeHtml(options.appPrivacyUrl)}">${escapeHtml(options.appName)} privacy</a><a href="/legal/privacy/">${escapeHtml(site.footer.lifeLoomPrivacy)}</a>`
    : `<a href="/legal/">${escapeHtml(site.footer.legal)}</a><a href="/legal/privacy/">${escapeHtml(site.footer.privacy)}</a>`;

  return replaceTokens(template, {
    ASSET_VERSION: escapeHtml(assetVersion),
    BRAND_NAME: escapeHtml(site.brandName),
    SLOGAN: escapeHtml(site.slogan),
    FOOTER_APPS_HEADING: escapeHtml(site.footer.appsHeading),
    FOOTER_ALL_APPS: escapeHtml(site.footer.allApps),
    FOOTER_APP_LINKS: renderFooterAppLinks(apps),
    FOOTER_SUPPORT_HEADING: escapeHtml(site.footer.supportHeading),
    ACTION_GET_SUPPORT: escapeHtml(site.actions.getSupport),
    FOOTER_LEGAL_HEADING: escapeHtml(site.footer.legalHeading),
    FOOTER_LEGAL_LINKS: legalLinks,
    FOOTER_BOTTOM_EXTRA: options.showDomain ? `<span>${escapeHtml(site.domain)}</span>` : ''
  });
}
