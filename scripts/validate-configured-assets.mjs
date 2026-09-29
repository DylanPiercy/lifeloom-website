import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { isExternalAsset } from './lib/assets.mjs';
import { isMainModule } from './lib/module.mjs';
import { getAppPresentation } from './lib/render.mjs';

function normalisePublicAssetPath(value) {
  const asset = String(value || '').trim();
  if (!asset || isExternalAsset(asset)) return '';
  return asset.startsWith('/') ? asset : `/${asset}`;
}

function configuredAppAssetPaths(app) {
  const assets = app.assets || {};
  const publicDirectory = String(assets.publicDirectory || '').trim().replace(/\/$/, '');
  const values = Object.entries(assets)
    .filter(([key, value]) => !['sourceDirectory', 'publicDirectory'].includes(key) && typeof value === 'string' && value.trim())
    .map(([, value]) => value.trim());

  const logo = String(app.card?.logo || '').trim();
  if (logo) values.push(logo);

  return values.map((value) => {
    if (isExternalAsset(value)) return '';
    if (value.startsWith('/')) return value;
    return publicDirectory ? `${publicDirectory}/${value}` : value;
  });
}

export async function validateConfiguredAssets(context) {
  context ??= await createBuildContext();
  const { apps, publicDir, sharedTokens, site } = context;

  const configured = [
    sharedTokens.BRAND_SYMBOL_ASSET,
    sharedTokens.BRAND_LIGHT_ASSET,
    sharedTokens.BRAND_DARK_ASSET,
    sharedTokens.BRAND_INLINE_LIGHT_ASSET,
    sharedTokens.BRAND_INLINE_DARK_ASSET,
    sharedTokens.FAVICON_ASSET,
    sharedTokens.SOCIAL_IMAGE_ASSET,
    sharedTokens.APP_PLACEHOLDER_ASSET,
    ...apps.map((app) => getAppPresentation(app, site, sharedTokens).logoAsset),
    ...apps.flatMap(configuredAppAssetPaths)
  ];

  const paths = [...new Set(configured.map(normalisePublicAssetPath).filter(Boolean))];
  const missing = [];

  for (const assetPath of paths) {
    const outputPath = path.join(publicDir, assetPath.replace(/^\/+/, ''));
    try {
      const stat = await fs.stat(outputPath);
      if (!stat.isFile()) missing.push(assetPath);
    } catch {
      missing.push(assetPath);
    }
  }

  if (missing.length) {
    throw new Error(`Configured public asset${missing.length === 1 ? '' : 's'} missing from build output:\n${missing.map((asset) => `- ${asset}`).join('\n')}`);
  }

  console.log(`Validated ${paths.length} configured public asset${paths.length === 1 ? '' : 's'}.`);
}

if (isMainModule(import.meta.url)) {
  await validateConfiguredAssets();
}
