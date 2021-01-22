import { readFile } from 'fs';

/**
 * promisify readFile
 * @ignore
 */
export const promiseToReadFile = path =>
  new Promise<string>((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(Buffer.from(data).toString());
    });
  });
