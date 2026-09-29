import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { assertFilesExist } from './lib/assets.mjs';
import { isMainModule } from './lib/module.mjs';

const DIRECTORY_KEYS = new Set(['sourceDirectory', 'publicDirectory']);

function getConfiguredAppAssets(app) {
  const assets = app.assets || {};
  const configured = Object.entries(assets)
    .filter(([key, value]) => !DIRECTORY_KEYS.has(key) && typeof value === 'string' && value.trim())
    .map(([, value]) => value.trim());

  if (typeof app.card?.logo === 'string' && app.card.logo.trim()) {
    configured.push(app.card.logo.trim());
  }

  return [...new Set(
    configured.filter((value) => !value.startsWith('/') && !/^https?:\/\//i.test(value))
  )];
}

async function copyAppAssets(root, app) {
  const assets = app.assets || {};
  const sourceDirectory = String(assets.sourceDirectory || '').trim();
  const publicDirectory = String(assets.publicDirectory || '').trim();
  const files = getConfiguredAppAssets(app);

  if (!files.length) return { copied: 0, configured: 0 };
  if (!sourceDirectory || !publicDirectory) {
    throw new Error(`${app.name} assets must define sourceDirectory and publicDirectory.`);
  }

  const sourceDir = path.resolve(root, sourceDirectory);
  const outputDir = path.join(root, 'public', publicDirectory.replace(/^\/+/, ''));
  const sources = files.map((fileName) => path.join(sourceDir, fileName));
  await assertFilesExist(root, sources, `${app.name} asset`);

  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  for (let index = 0; index < files.length; index += 1) {
    const fileName = files[index];
    await fs.copyFile(sources[index], path.join(outputDir, path.basename(fileName)));
  }

  console.log(`Prepared ${files.length}/${files.length} ${app.name} asset${files.length === 1 ? '' : 's'}.`);
  return { copied: files.length, configured: files.length };
}

export async function buildAppAssets(context) {
  context ??= await createBuildContext();
  const { root, apps } = context;

  for (const app of apps) {
    await copyAppAssets(root, app);
  }
}

if (isMainModule(import.meta.url)) {
  await buildAppAssets();
}
