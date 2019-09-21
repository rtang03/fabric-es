import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export const readAllFiles: (dir: string) => Buffer[] = dir => {
  const files = readdirSync(dir);
  const certs = [];
  files.forEach(filename => {
    certs.push(readFileSync(join(dir, filename)));
  });
  return certs;
};
