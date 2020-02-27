export const makeKey = (keyParts: string[]) => keyParts.map(part => JSON.stringify(part)).join('~');

export const splitKey = (key: string) => key.split('~');
