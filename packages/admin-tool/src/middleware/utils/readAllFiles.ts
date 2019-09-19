import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export const readAllFiles = (dir: string) => {
  const files = readdirSync(dir);
  const certs: Buffer[] = [];
  files.forEach(filename => {
    certs.push(readFileSync(join(dir, filename)));
  });
  return certs;
};
