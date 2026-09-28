import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function isMainModule(moduleUrl) {
  return Boolean(process.argv[1])
    && path.resolve(process.argv[1]) === fileURLToPath(moduleUrl);
}
