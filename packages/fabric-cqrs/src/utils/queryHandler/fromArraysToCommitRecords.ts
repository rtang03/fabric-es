import flatten from 'lodash/flatten';
import { Commit } from '../../types';

export const fromArraysToCommitRecords: (commitArrays: string[][]) => Record<string, Commit> = (
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
