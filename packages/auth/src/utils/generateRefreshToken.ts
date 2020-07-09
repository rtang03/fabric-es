import { randomBytes } from 'crypto';

export const generateRefreshToken = (len = 10) =>
  randomBytes(len)
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
    .replace(/:/g, '')
    .replace(/!/g, '')
    .replace(/$/g, '')
    .replace(/&/g, '');
