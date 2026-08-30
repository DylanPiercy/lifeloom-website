import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const configPath = path.join(root, 'config', 'site.local.json');
const runtimeDir = path.join(root, 'public', 'runtime');
const runtimeBrandDir = path.join(runtimeDir, 'brand');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(configPath))) {
  throw new Error('Missing config/site.local.json. Copy config/site.example.json first.');
}

const localConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));

if (!localConfig.firebaseProjectId || localConfig.firebaseProjectId === 'YOUR_FIREBASE_PROJECT_ID') {
  console.warn('Firebase project ID is not configured yet; .firebaserc will not be generated.');
} else {
  const firebaseRc = {
    projects: { default: localConfig.firebaseProjectId }
  };
  await fs.writeFile(path.join(root, '.firebaserc'), `${JSON.stringify(firebaseRc, null, 2)}\n`);
}

await fs.rm(runtimeDir, { recursive: true, force: true });
await fs.mkdir(runtimeBrandDir, { recursive: true });

const runtimeConfig = {
  supportEmail: localConfig.supportEmail || '',
  brandAssets: {},
  storeLinks: localConfig.storeLinks || {}
};

for (const [brandKey, fileName] of Object.entries(localConfig.brandAssets || {})) {
  if (!fileName) continue;
  const source = path.join(root, 'brand-assets', fileName);
  if (!(await exists(source))) {
    console.warn(`Brand asset not found: brand-assets/${fileName}`);
    continue;
  }

  const safeName = path.basename(fileName);
  const destination = path.join(runtimeBrandDir, safeName);
  await fs.copyFile(source, destination);
  runtimeConfig.brandAssets[brandKey] = `/runtime/brand/${safeName}`;
}

await fs.writeFile(
  path.join(runtimeDir, 'site-config.json'),
  `${JSON.stringify(runtimeConfig, null, 2)}\n`
);

console.log('LifeLoom local configuration prepared.');
