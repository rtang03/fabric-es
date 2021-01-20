import { readFile } from 'fs';

/**
 * @ignore
 * @param path
 */
export const promiseToReadFile = (path: string) =>
  new Promise<string>((resolve, reject) =>
    readFile(path, (err, data) => (err ? reject(err) : resolve(Buffer.from(data).toString())))
  );
