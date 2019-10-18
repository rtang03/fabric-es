export const parseResult = input =>
  JSON.parse(Buffer.from(JSON.parse(input)).toString());

export const toString = input => JSON.stringify(input).replace(/"/g, '\\"');
