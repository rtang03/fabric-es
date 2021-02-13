import type { OutputCommit } from './types';

export const isOutputCommit = (value: any): value is OutputCommit =>
  value?.id !== undefined &&
  value?.entityName !== undefined &&
  value?.commitId !== undefined &&
  value?.mspId !== undefined &&
  value?.event !== undefined &&
  value?.entityId !== undefined &&
  typeof value?.version === 'number' &&
  typeof value?.ts === 'number';
