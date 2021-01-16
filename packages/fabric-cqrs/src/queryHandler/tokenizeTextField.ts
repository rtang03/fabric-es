/**
 * @packageDocumentation
 * @hidden
 */

export const tokenizeTextField = (input: string) =>
  input.replace(/-/g, ',').replace(/\./g, ',').replace(/~/g, ',');
