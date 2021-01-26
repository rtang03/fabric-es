import { CommitHashFields } from './types';

export const isCommitHashFields = (value: any): value is CommitHashFields =>
  value?.cid !== undefined &&
  value?.event !== undefined &&
  value?.msp !== undefined &&
  value?.evstr !== undefined &&
  value?.id !== undefined &&
  value?.type !== undefined &&
  value?.v !== undefined;
