import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createBuildContext } from './lib/build-context.mjs';
import { isMainModule } from './lib/module.mjs';

async function copyDirectory(sourceDir, outputDir) {
  try {
    await fs.access(sourceDir);
  } catch {
    return false;
  }

  await fs.mkdir(path.dirname(outputDir), { recursive: true });
  await fs.cp(sourceDir, outputDir, { recursive: true, force: true });
  return true;
}

async function copyFile(source, output) {
  try {
    await fs.access(source);
  } catch {
    return false;
  }

  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.copyFile(source, output);
  return true;
}

export async function buildStaticAssets(context) {
  context ??= await createBuildContext();
  const { root, srcDir, publicDir } = context;

  const copies = [
    ['CSS', path.join(srcDir, 'css'), path.join(publicDir, 'assets', 'css')],
    ['JavaScript', path.join(srcDir, 'js'), path.join(publicDir, 'assets', 'js')],
    ['shared images', path.join(root, 'assets', 'img'), path.join(publicDir, 'assets', 'img')]
  ];

  for (const [label, source, output] of copies) {
    if (!(await copyDirectory(source, output))) {
      throw new Error(`Missing ${label} source directory: ${path.relative(root, source)}`);
    }
  }

  const staticDir = path.join(srcDir, 'static');
  const staticFiles = await fs.readdir(staticDir, { withFileTypes: true });
  for (const entry of staticFiles) {
    if (!entry.isFile()) continue;
    await copyFile(path.join(staticDir, entry.name), path.join(publicDir, entry.name));
  }

  console.log('Prepared tracked static website assets.');
}

if (isMainModule(import.meta.url)) {
  await buildStaticAssets();
}
