import values from 'lodash/values';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { Commit, RepoFcn_Id } from '../types';
import { dispatcher } from './dispatcher';

/**
 * get commit by entityId
 * Basic Query-side Operation
 * @param entityName
 * @param store
 * @param logger
 */
export const queryGetCommitByEntityId: (
  entityName: string,
  option: { logger: Logger; store: Store }
) => RepoFcn_Id<Commit[]> = (entityName, { store, logger }) =>
  dispatcher<Commit[], { id: string }>(
    ({ tx_id, args: { id } }) => action.queryByEntityId({ tx_id, args: { id, entityName } }),
    {
      name: 'getCommitByid',
      store,
      slice: 'query',
      SuccessAction: action.QUERY_SUCCESS,
      ErrorAction: action.QUERY_ERROR,
      logger,
    },
    (result) => values<Commit>(result).reverse()
  );
