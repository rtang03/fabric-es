import deleteByEntityIdEpic from './deleteByEntityId';
import deleteByEntityNameEpic from './deleteByEntityName';
import mergeEpic from './mergeCommit';
import mergeBatchEpic from './mergeCommitBatch';
import queryByEntityIdEpic from './queryByEntityId';
import queryByEntityNameEpic from './queryByEntityName';

export const epic = [
  deleteByEntityNameEpic,
  deleteByEntityIdEpic,
  queryByEntityNameEpic,
  queryByEntityIdEpic,
  mergeEpic,
  mergeBatchEpic
];
