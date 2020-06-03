/**
 * @packageDocumentation
 * @hidden
 */
import createEpic from './create';
import deleteByEntityIdEpic from './deleteByEntityId';
import deleteByEntityIdCommitId from './deleteByEntityIdCommitId';
import queryByEntityIdEpic from './queryByEntityId';
import queryByEntityIdCommitIdEpic from './queryByEntityIdCommitId';
import queryByEntityNameEpic from './queryByEntityName';
import trackEpic from './track';

export const epic = [
  createEpic,
  deleteByEntityIdEpic,
  queryByEntityIdCommitIdEpic,
  queryByEntityNameEpic,
  queryByEntityIdEpic,
  deleteByEntityIdCommitId,
  trackEpic
];
