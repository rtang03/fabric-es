import deleteByEntityNameEpic from './deleteByEntityName';
import deleteByEntityIdEpic from './deleteCommitByEntityId';
import findEpic from './find';
import fullTextSearchCIdxEpic from './fullTextSearchCIdx';
import fullTextSearchEIdxEpic from './fullTextSearchEIdx';
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
  mergeBatchEpic,
  fullTextSearchCIdxEpic,
  fullTextSearchEIdxEpic,
  findEpic,
];
