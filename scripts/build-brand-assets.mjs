import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourceDir = path.join(root, 'assets', 'lifeloom');
const outputDir = path.join(root, 'public', 'assets', 'lifeloom');

const assets = [
  { output: 'lifeloom.png', candidates: ['lifeloom.png'] },
  { output: 'lifeloom_light.png', candidates: ['lifeloom_light.png'] },
  { output: 'lifeloom_dark.png', candidates: ['lifeloom_dark.png'] },
  { output: 'lifeloom_inline_light.png', candidates: ['lifeloom_inline_light.png'] },
  { output: 'lifeloom_inline_dark.png', candidates: ['lifeloom_inline_dark.png'] }
];

async function findSource(candidates) {
  for (const candidate of candidates) {
    const source = path.join(sourceDir, candidate);
    try {
      await fs.access(source);
      return { source, candidate };
    } catch {
      // Try the next supported filename.
    }
  }
  return null;
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

let copied = 0;
for (const asset of assets) {
  const match = await findSource(asset.candidates);
  if (!match) {
    console.warn(`LifeLoom logo not found: assets/lifeloom/${asset.candidates[0]}`);
    continue;
  }

  await fs.copyFile(match.source, path.join(outputDir, asset.output));
  copied += 1;
}

console.log(`Prepared ${copied}/${assets.length} LifeLoom logo asset${copied === 1 ? '' : 's'}.`);
