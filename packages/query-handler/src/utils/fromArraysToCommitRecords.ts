import { Commit } from '@fabric-es/fabric-cqrs';
import flatten from 'lodash/flatten';

export const fromArraysToCommitRecords: (commitArrays: string[][]) => Record<string, Commit> = (commitArrays) => {
  const result: any = {};
  flatten(commitArrays)
    .filter((item) => !!item)
    .forEach((item) => {
      const commit = JSON.parse(item);
      result[commit.commitId] = commit;
    });
  return result;
};
