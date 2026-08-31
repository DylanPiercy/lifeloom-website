import { promises as fs } from 'node:fs';
import path from 'node:path';

const FILE_NAME = '.build-version';

export async function createBuildVersion(root) {
  const version = `${Date.now()}`;
  await fs.writeFile(path.join(root, FILE_NAME), `${version}\n`, 'utf8');
  return version;
}

export async function readBuildVersion(root) {
  const filePath = path.join(root, FILE_NAME);
  try {
    const version = (await fs.readFile(filePath, 'utf8')).trim();
    if (version) return version;
  } catch {
    // Individual build scripts can still work when run directly.
  }

  return createBuildVersion(root);
}
