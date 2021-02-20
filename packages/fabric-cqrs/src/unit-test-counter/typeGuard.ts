import type { OutputCounter } from './types';

/**
 * @ignore
 */
export const isOutputCounter = (input: any): input is OutputCounter =>
  input?.createdAt !== undefined &&
  input?.creator !== undefined &&
  input?.description !== undefined &&
  input?.eventInvolved !== undefined &&
  input?.id !== undefined &&
  input?.tags !== undefined &&
  input?.timestamp !== undefined &&
  input?.value !== undefined;
