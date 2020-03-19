/**
 * @packageDocumentation
 * @hidden
 */
import deleteByEntityIdEpic from './deleteByEntityId';
import deleteByEntityNameEpic from './deleteByEntityName';
import mergeEpic from './merge';
import mergeBatchEpic from './mergeBatch';
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
