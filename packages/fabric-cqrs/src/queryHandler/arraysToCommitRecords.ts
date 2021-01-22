import flatten from 'lodash/flatten';
import type { Commit } from '../types';

/**
 * transform array of commit to record of commit
 * @ignore
 * @param commitArrays
 */
export const arraysToCommitRecords: (commitArrays: string[][]) => Record<string, Commit> = (
  commitArrays
) => {
  const result: any = {};
  flatten(commitArrays)
    .filter((item) => !!item)
    .forEach((item) => {
      const commit = JSON.parse(item);
      result[commit.commitId] = commit;
    });
  return result;
};
