import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { assertFilesExist } from './lib/assets.mjs';
import { isMainModule } from './lib/module.mjs';

function getConfiguredBrandAssets(site) {
  const assets = site.assets || {};
  const brand = assets.brand || {};
  const publicDirectory = String(brand.publicDirectory || '').replace(/\/$/, '');
  const configured = [
    brand.symbol,
    brand.light,
    brand.dark,
    brand.inlineLight,
    brand.inlineDark
  ];

  for (const asset of [assets.favicon, assets.socialImage]) {
    const value = String(asset || '').trim();
    if (!value) continue;
    if (!value.startsWith('/')) configured.push(value);
    else if (publicDirectory && value.startsWith(`${publicDirectory}/`)) {
      configured.push(value.slice(publicDirectory.length + 1));
    }
  }

  return [...new Set(configured.filter(Boolean))];
}

export async function buildBrandAssets(context) {
  context ??= await createBuildContext();
  const { root, site } = context;
  const brand = site.assets?.brand || {};
  const sourceDirectory = String(brand.sourceDirectory || '').trim();
  const publicDirectory = String(brand.publicDirectory || '').trim();
  if (!sourceDirectory || !publicDirectory) {
    throw new Error('src/content/site.json must define assets.brand.sourceDirectory and assets.brand.publicDirectory.');
  }
  const sourceDir = path.resolve(root, sourceDirectory);
  const outputDir = path.join(root, 'public', publicDirectory.replace(/^\/+/, ''));
  const assets = [...new Set(getConfiguredBrandAssets(site))];

  const sources = assets.map((fileName) => path.join(sourceDir, fileName));
  await assertFilesExist(root, sources, 'LifeLoom asset');

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  for (let index = 0; index < assets.length; index += 1) {
    const fileName = assets[index];
    await fs.copyFile(sources[index], path.join(outputDir, path.basename(fileName)));
  }

  console.log(`Prepared ${assets.length}/${assets.length} LifeLoom logo asset${assets.length === 1 ? '' : 's'}.`);
}

if (isMainModule(import.meta.url)) {
  await buildBrandAssets();
}
