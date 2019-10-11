export const makeKey = (keyParts: any[]) =>
  keyParts.map(part => JSON.stringify(part)).join(':');
