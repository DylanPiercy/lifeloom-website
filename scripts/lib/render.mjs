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
