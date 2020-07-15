import type { FabricResponse, Commit } from '../types';

export const isCommitRecord = (input: unknown): input is Record<string, Commit> =>
  Object.entries(input)
    .map(
      ([key, value]) =>
        value?.commitId !== undefined &&
        value?.id !== undefined &&
        value?.entityId !== undefined &&
        value?.version !== undefined &&
        value?.entityName !== undefined &&
        value?.mspId !== undefined
    )
    .reduce((acc, curr) => curr && acc, true);

export const isCommit = (value: any): value is Commit =>
  value?.commitId !== undefined &&
  value?.id !== undefined &&
  value?.entityId !== undefined &&
  value?.version !== undefined &&
  value?.entityName !== undefined;
// for isCommit, no need to check mspId, which is optional

export const isFabricResponse = (input: any): input is FabricResponse =>
  input?.status !== undefined && input?.message !== undefined;
