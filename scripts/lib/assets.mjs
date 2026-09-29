import { promises as fs } from 'node:fs';
import path from 'node:path';

export function isExternalAsset(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export async function assertFilesExist(root, files, label) {
  const missing = [];

  for (const file of files) {
    try {
      await fs.access(file);
    } catch {
      missing.push(path.relative(root, file));
    }
  }

  if (!missing.length) return;

  const noun = missing.length === 1 ? 'file' : 'files';
  throw new Error(`Missing configured ${label} ${noun}:\n${missing.map((file) => `- ${file}`).join('\n')}`);
}
