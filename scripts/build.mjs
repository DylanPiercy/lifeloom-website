import process from 'node:process';
import { buildAppPages } from './build-app-pages.mjs';
import { buildBrandAssets } from './build-brand-assets.mjs';
import { buildCanonicalDomain } from './build-canonical-domain.mjs';
import { buildContentPages } from './build-content-pages.mjs';
import { createBuildContext } from './lib/build-context.mjs';
import { createBuildVersion } from './lib/build-version.mjs';

const root = process.cwd();
const version = await createBuildVersion(root);
console.log(`Created deployment asset version ${version}.`);

const context = await createBuildContext(root);

await buildBrandAssets(context);
await buildCanonicalDomain(context);
await buildContentPages(context);
await buildAppPages(context);
