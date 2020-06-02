/**
 * @packageDocumentation
 * @hidden
 */
import { randomBytes } from 'crypto';

export const generateToken = (len = 4) =>
  randomBytes(len).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
