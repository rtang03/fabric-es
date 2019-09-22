import { randomBytes } from 'crypto';

export function generateToken(len: number = 4): string {
  return randomBytes(len)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  // .replace(/\=/g, '');
}
