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


export function renderSupportDocumentCards(template, documents = [], sharedTokens = {}) {
  return documents.map((document) => replaceTokens(template, {
    ...sharedTokens,
    DOCUMENT_HREF: escapeHtml(document.href),
    DOCUMENT_TITLE: escapeHtml(document.title),
    DOCUMENT_DESCRIPTION: escapeHtml(document.description)
  })).join('');
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


function resolveAppAssetPath(app, value) {
  const asset = String(value || '').trim();
  if (!asset || asset.startsWith('/') || /^https?:\/\//i.test(asset)) return asset;

  const publicDirectory = String(app.assets?.publicDirectory || '').trim().replace(/\/$/, '');
  return publicDirectory ? `${publicDirectory}/${asset}` : asset;
}

export function getAppPresentation(app, site, sharedTokens) {
  const card = app.card || {};
  const configuredLogo = card.logo ?? app.assets?.icon;
  const logoAsset = resolveAppAssetPath(app, configuredLogo) || sharedTokens.APP_PLACEHOLDER_ASSET;

  return {
    colour: String(card.colour || site.appUi?.defaultCardColour || '#8178ff').trim(),
    logoAsset: String(logoAsset).trim()
  };
}

function releaseDateValue(app) {
  return String(app.availability?.releaseDate || '').trim();
}

function parseReleaseDate(value) {
  if (!value) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatReleaseDate(value) {
  const date = parseReleaseDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function releaseState(app, now = new Date()) {
  const value = releaseDateValue(app);
  if (!value) return 'coming-soon';
  const releaseDate = parseReleaseDate(value);
  if (!releaseDate) return 'coming-soon';
  return releaseDate.getTime() <= now.getTime() ? 'released' : 'scheduled';
}

function releaseStatusText(app, site) {
  const state = releaseState(app);
  const date = formatReleaseDate(releaseDateValue(app));
  if (state === 'released') return site.appUi?.released || 'Released';
  if (state === 'scheduled') return `${site.appUi?.comingOn || 'Coming on'} ${date}`;
  return site.appUi?.comingSoon || 'Coming Soon';
}

export function renderReleaseStatus(app, site) {
  const releaseDate = releaseDateValue(app);
  return `<span class="app-status" data-release-status data-release-date="${escapeHtml(releaseDate)}" data-coming-soon-label="${escapeHtml(site.appUi?.comingSoon || 'Coming Soon')}" data-coming-on-label="${escapeHtml(site.appUi?.comingOn || 'Coming on')}" data-released-label="${escapeHtml(site.appUi?.released || 'Released')}">${escapeHtml(releaseStatusText(app, site))}</span>`;
}

export function renderAppCard(template, app, site, sharedTokens) {
  const { colour, logoAsset } = getAppPresentation(app, site, sharedTokens);
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
    APP_COLOUR: escapeHtml(colour),
    APP_LOGO_ASSET: escapeHtml(logoAsset),
    APP_HIGHLIGHTS: highlights,
    APP_ACTION_LABEL: escapeHtml(site.appUi.viewApp || 'Explore App'),
    APP_STATUS: renderReleaseStatus(app, site)
  });
}



const APP_PLATFORM_KEYS = ['ios', 'android', 'web'];

function renderFeatureBody(feature) {
  const points = Array.isArray(feature.points) ? feature.points.filter(Boolean) : [];
  if (points.length) {
    return `<ul>${points.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>`;
  }
  return feature.description ? `<p>${escapeHtml(feature.description)}</p>` : '';
}

export function renderAppFeatures(template, features = [], sharedTokens = {}) {
  return features.map((feature, index) => replaceTokens(template, {
    ...sharedTokens,
    FEATURE_NUMBER: String(index + 1).padStart(2, '0'),
    FEATURE_TITLE: escapeHtml(feature.title),
    FEATURE_BODY: renderFeatureBody(feature)
  })).join('');
}

function enabledPlatforms(app) {
  return APP_PLATFORM_KEYS.filter((key) => app.platforms?.[key] === true);
}

function platformLabel(site, key) {
  return site.appUi?.platforms?.[key] || ({ ios: 'iOS', android: 'Android', web: 'Web' })[key] || key;
}

function renderPlatformBadges(app, site) {
  return enabledPlatforms(app)
    .map((key) => `<span class="app-platform-pill" data-platform="${escapeHtml(key)}">${escapeHtml(platformLabel(site, key))}</span>`)
    .join('');
}

function renderPlatformLinks(app, site) {
  const links = app.availability?.links || {};
  const actions = site.appUi?.platformActions || {};
  const items = enabledPlatforms(app).map((key) => {
    const value = String(links[key] || '').trim();
    if (!value) return '';
    const label = actions[key] || platformLabel(site, key);
    if (/^https?:\/\//i.test(value)) {
      return `<a class="button button-secondary app-platform-link" href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer" data-release-link data-link-ready="true" hidden>${escapeHtml(label)}</a>`;
    }
    return `<a class="button button-secondary app-platform-link" href="#" data-store-link="${escapeHtml(value)}" data-release-link data-link-ready="false" hidden>${escapeHtml(label)}</a>`;
  }).filter(Boolean).join('');

  return items ? `<div class="app-availability-links" data-release-links hidden>${items}</div>` : '';
}

function availabilityFallback(app, site) {
  const state = releaseState(app);
  const date = formatReleaseDate(releaseDateValue(app));
  if (state === 'released') {
    return {
      heading: `${app.name} ${site.appUi?.releasedHeading || 'is available.'}`,
      description: `${site.appUi?.releasedDescription || 'Released on'} ${date}.`,
      releaseLabel: site.appUi?.released || 'Released',
      platformLabel: site.appUi?.availableOn || 'Available on'
    };
  }
  if (state === 'scheduled') {
    return {
      heading: `${app.name} ${site.appUi?.scheduledHeading || 'is coming on'} ${date}.`,
      description: `${site.appUi?.scheduledDescription || 'This app is scheduled for release on'} ${date}.`,
      releaseLabel: site.appUi?.comingOn || 'Coming on',
      platformLabel: site.appUi?.inDevelopmentFor || 'Currently being developed for'
    };
  }
  return {
    heading: `${app.name} ${site.appUi?.comingSoonHeading || 'is coming soon.'}`,
    description: site.appUi?.comingSoonDescription || 'This app is currently in development.',
    releaseLabel: site.appUi?.releaseDate || 'Release date',
    platformLabel: site.appUi?.inDevelopmentFor || 'Currently being developed for'
  };
}

export function renderAppAvailability(template, app, site, sharedTokens, presentation) {
  const releaseDate = releaseDateValue(app);
  const releaseDateDisplay = formatReleaseDate(releaseDate);
  const fallback = availabilityFallback(app, site);

  return replaceTokens(template, {
    ...sharedTokens,
    APP_NAME: escapeHtml(app.name),
    APP_LOGO_ASSET: escapeHtml(presentation.logoAsset),
    RELEASE_DATE_RAW: escapeHtml(releaseDate),
    RELEASE_DATE_DISPLAY: escapeHtml(releaseDateDisplay),
    RELEASE_DATE_HIDDEN: releaseDate ? '' : ' hidden',
    RELEASE_DATE_LABEL: escapeHtml(fallback.releaseLabel),
    COMING_SOON_LABEL: escapeHtml(site.appUi?.comingSoon || 'Coming Soon'),
    COMING_ON_LABEL: escapeHtml(site.appUi?.comingOn || 'Coming on'),
    RELEASED_LABEL: escapeHtml(site.appUi?.released || 'Released'),
    COMING_SOON_HEADING: escapeHtml(site.appUi?.comingSoonHeading || 'is coming soon.'),
    COMING_SOON_DESCRIPTION: escapeHtml(site.appUi?.comingSoonDescription || 'This app is currently in development.'),
    SCHEDULED_HEADING: escapeHtml(site.appUi?.scheduledHeading || 'is coming on'),
    SCHEDULED_DESCRIPTION: escapeHtml(site.appUi?.scheduledDescription || 'This app is scheduled for release on'),
    RELEASED_HEADING: escapeHtml(site.appUi?.releasedHeading || 'is available.'),
    RELEASED_DESCRIPTION: escapeHtml(site.appUi?.releasedDescription || 'Released on'),
    IN_DEVELOPMENT_LABEL: escapeHtml(site.appUi?.inDevelopmentFor || 'Currently being developed for'),
    AVAILABLE_ON_LABEL: escapeHtml(site.appUi?.availableOn || 'Available on'),
    AVAILABILITY_EYEBROW: escapeHtml(app.availability?.eyebrow || site.appUi?.availability || 'Availability'),
    AVAILABILITY_HEADING: escapeHtml(fallback.heading),
    AVAILABILITY_DESCRIPTION: escapeHtml(fallback.description),
    AVAILABILITY_PLATFORM_LABEL: escapeHtml(fallback.platformLabel),
    AVAILABILITY_PLATFORMS: renderPlatformBadges(app, site),
    AVAILABILITY_LINKS: renderPlatformLinks(app, site)
  });
}


export function renderSiteFooter(template, site, apps, sharedTokens, options = {}) {
  return replaceTokens(template, {
    ...sharedTokens,
    FOOTER_APPS_HEADING: escapeHtml(site.footer.appsHeading),
    FOOTER_ALL_APPS: escapeHtml(site.footer.allApps),
    FOOTER_APP_LINKS: renderFooterAppLinks(apps),
    FOOTER_SUPPORT_HEADING: escapeHtml(site.footer.supportHeading),
    FOOTER_DOCUMENTS: escapeHtml(site.footer.documents),
    FOOTER_BOTTOM_EXTRA: options.showDomain ? `<span>${escapeHtml(site.domain)}</span>` : ''
  });
}
