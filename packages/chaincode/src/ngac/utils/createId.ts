export const createId: (parts: string[]) => string = parts => parts[0] + '::' + parts[1];
