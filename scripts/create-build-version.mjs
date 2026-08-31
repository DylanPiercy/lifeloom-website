import path from 'node:path';
import process from 'node:process';
import { createBuildVersion } from './lib/build-version.mjs';

const root = process.cwd();
const version = await createBuildVersion(root);
console.log(`Created deployment asset version ${version}.`);
