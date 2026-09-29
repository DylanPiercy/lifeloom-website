import { promises as fs } from 'node:fs';
import process from 'node:process';
import { buildAppAssets } from './build-app-assets.mjs';
import { buildAppPages } from './build-app-pages.mjs';
import { buildBrandAssets } from './build-brand-assets.mjs';
import { buildCanonicalDomain } from './build-canonical-domain.mjs';
import { buildContentPages } from './build-content-pages.mjs';
import { buildStaticAssets } from './build-static-assets.mjs';
import { buildSitemap } from './build-sitemap.mjs';
import { createBuildContext } from './lib/build-context.mjs';
import { createBuildVersion } from './lib/build-version.mjs';
import { validateConfiguredAssets } from './validate-configured-assets.mjs';

const root = process.cwd();
const version = await createBuildVersion(root);
console.log(`Created deployment asset version ${version}.`);

const context = await createBuildContext(root);

// Firebase Hosting output is intentionally disposable. A full build always
// recreates public/ from tracked source, content, templates and assets.
await fs.rm(context.publicDir, { recursive: true, force: true });
await fs.mkdir(context.publicDir, { recursive: true });

await buildStaticAssets(context);
await buildBrandAssets(context);
await buildAppAssets(context);
await validateConfiguredAssets(context);
await buildCanonicalDomain(context);
await buildContentPages(context);
await buildAppPages(context);
await buildSitemap(context);
