import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { readBuildVersion } from './build-version.mjs';
import { escapeHtml, readJson } from './render.mjs';

const PARTIAL_FILES = {
  head: 'site-head.html',
  header: 'site-header.html',
  footer: 'site-footer.html',
  scripts: 'site-scripts.html',
  appCard: 'app-card.html'
};

function normaliseAssetPath(value, basePath = '') {
  const asset = String(value || '').trim();
  if (!asset) return '';
  if (asset.startsWith('/') || /^https?:\/\//i.test(asset)) return asset;
  return `${basePath.replace(/\/$/, '')}/${asset}`;
}

function absoluteAssetUrl(assetPath, domain) {
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  return `https://${domain}${assetPath}`;
}

export function createSharedSiteTokens(site, assetVersion) {
  const assets = site.assets || {};
  const brand = assets.brand || {};
  const brandPublicDirectory = String(brand.publicDirectory || '').trim();
  if (!brandPublicDirectory) {
    throw new Error('content/site.json must define assets.brand.publicDirectory.');
  }

  const brandSymbol = normaliseAssetPath(brand.symbol, brandPublicDirectory);
  const brandLight = normaliseAssetPath(brand.light, brandPublicDirectory);
  const brandDark = normaliseAssetPath(brand.dark, brandPublicDirectory);
  const brandInlineLight = normaliseAssetPath(brand.inlineLight, brandPublicDirectory);
  const brandInlineDark = normaliseAssetPath(brand.inlineDark, brandPublicDirectory);
  const favicon = normaliseAssetPath(assets.favicon, brandPublicDirectory);
  const socialImage = normaliseAssetPath(assets.socialImage, brandPublicDirectory);
  const appPlaceholder = normaliseAssetPath(assets.appPlaceholder);

  const requiredAssets = {
    'assets.brand.symbol': brandSymbol,
    'assets.brand.light': brandLight,
    'assets.brand.dark': brandDark,
    'assets.brand.inlineLight': brandInlineLight,
    'assets.brand.inlineDark': brandInlineDark,
    'assets.favicon': favicon,
    'assets.socialImage': socialImage,
    'assets.appPlaceholder': appPlaceholder
  };
  for (const [key, value] of Object.entries(requiredAssets)) {
    if (!value) throw new Error(`content/site.json must define ${key}.`);
  }

  return {
    ASSET_VERSION: escapeHtml(assetVersion),
    BRAND_NAME: escapeHtml(site.brandName),
    SLOGAN: escapeHtml(site.slogan),
    DOMAIN: escapeHtml(site.domain),
    SKIP_TO_CONTENT: escapeHtml(site.navigation.skipToContent),
    NAV_HOME: escapeHtml(site.navigation.home),
    NAV_SUPPORT: escapeHtml(site.navigation.support),
    NAV_EXPLORE_APPS: escapeHtml(site.navigation.exploreApps),
    NAV_OPEN: escapeHtml(site.navigation.openNavigation),
    NAV_PRIMARY_ARIA: escapeHtml(site.navigation.primaryAriaLabel),
    THEME_LIGHT_LABEL: escapeHtml(site.navigation.switchToLightMode),
    THEME_DARK_LABEL: escapeHtml(site.navigation.switchToDarkMode),
    ACTION_SEE_OUR_APPS: escapeHtml(site.actions.seeOurApps),
    ACTION_SUPPORT: escapeHtml(site.actions.support),
    ACTION_GET_SUPPORT: escapeHtml(site.actions.getSupport),
    ACTION_PRIVACY_POLICY: escapeHtml(site.actions.privacyPolicy),
    LEGAL_LAST_UPDATED_LABEL: escapeHtml(site.legal.lastUpdatedLabel),
    BRAND_SYMBOL_ASSET: escapeHtml(brandSymbol),
    BRAND_LIGHT_ASSET: escapeHtml(brandLight),
    BRAND_DARK_ASSET: escapeHtml(brandDark),
    BRAND_INLINE_LIGHT_ASSET: escapeHtml(brandInlineLight),
    BRAND_INLINE_DARK_ASSET: escapeHtml(brandInlineDark),
    FAVICON_ASSET: escapeHtml(favicon),
    SOCIAL_IMAGE_ASSET: escapeHtml(socialImage),
    SOCIAL_IMAGE_URL: escapeHtml(absoluteAssetUrl(socialImage, site.domain)),
    APP_PLACEHOLDER_ASSET: escapeHtml(appPlaceholder)
  };
}

async function loadApps(appContentDir) {
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

    const card = app.card || {};
    if (card.comingSoon !== undefined && typeof card.comingSoon !== 'boolean') {
      throw new Error(`App card comingSoon must be a boolean in ${file}.`);
    }
    if (card.order !== undefined && !Number.isFinite(card.order)) {
      throw new Error(`App card order must be a number in ${file}.`);
    }
    if (card.logo !== undefined && card.logo !== null && typeof card.logo !== 'string') {
      throw new Error(`App card logo must be a string or null in ${file}.`);
    }

    if (app.assets !== undefined) {
      if (!app.assets || typeof app.assets !== 'object' || Array.isArray(app.assets)) {
        throw new Error(`App assets must be an object in ${file}.`);
      }

      const sourceDirectory = String(app.assets.sourceDirectory || '').trim();
      const publicDirectory = String(app.assets.publicDirectory || '').trim();
      const configuredFiles = Object.entries(app.assets)
        .filter(([key]) => !['sourceDirectory', 'publicDirectory'].includes(key))
        .map(([, value]) => value)
        .filter((value) => value !== undefined && value !== null);

      if (configuredFiles.length && (!sourceDirectory || !publicDirectory)) {
        throw new Error(`App assets must define sourceDirectory and publicDirectory in ${file}.`);
      }
      if (configuredFiles.some((value) => typeof value !== 'string')) {
        throw new Error(`Configured app asset filenames must be strings in ${file}.`);
      }
    }

    apps.push(app);
  }
  return apps;
}

export async function createBuildContext(root = process.cwd()) {
  const contentDir = path.join(root, 'content');
  const templatesDir = path.join(root, 'templates');
  const partialsDir = path.join(templatesDir, 'partials');
  const publicDir = path.join(root, 'public');
  const appContentDir = path.join(contentDir, 'apps');
  const assetVersion = await readBuildVersion(root);

  const [site, apps] = await Promise.all([
    readJson(path.join(contentDir, 'site.json')),
    loadApps(appContentDir)
  ]);

  const partialEntries = await Promise.all(
    Object.entries(PARTIAL_FILES).map(async ([key, file]) => [
      key,
      await fs.readFile(path.join(partialsDir, file), 'utf8')
    ])
  );

  return {
    root,
    contentDir,
    appContentDir,
    templatesDir,
    publicDir,
    assetVersion,
    site,
    apps,
    partials: Object.fromEntries(partialEntries),
    sharedTokens: createSharedSiteTokens(site, assetVersion)
  };
}
