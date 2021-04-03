import type { FabricResponse, Commit, BaseEvent } from '../types';

export const isCommitRecord = (input: Record<string, any>): input is Record<string, Commit> =>
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

export const isBaseEventArray = (input: any): input is BaseEvent[] =>
  input
    .map((item) => {
      return item?.type !== undefined && item?.payload !== undefined;
    })
    .reduce((prev, curr) => curr && prev, true);
