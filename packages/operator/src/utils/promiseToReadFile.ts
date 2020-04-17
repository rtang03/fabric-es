import { readFile } from 'fs';

export const promiseToReadFile = path =>
  new Promise<string>((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(Buffer.from(data).toString());
    });
  });
