import { Commit } from '../types';

/**
 * @about typeGuard
 * @param input
 */
export const isCommitRecord = (input: unknown): input is Record<string, Commit> =>
  Object.entries(input)
    .map(
      ([key, value]) =>
        value?.commitId !== undefined &&
        value?.id !== undefined &&
        value?.entityId !== undefined &&
        value?.version !== undefined &&
        value?.entityName !== undefined
    )
    .reduce((acc, curr) => curr && acc, true);
