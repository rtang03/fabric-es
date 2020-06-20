import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { RepoFcn, QueryDatabaseResponse } from '../types';
import { dispatcher } from './dispatcher';

/**
 * delete commit by entityName
 * Basic Query-side Operation
 * @param entityName
 * @param logger
 * @param store
 */
export const queryDeleteCommitByEntityName: (
  entityName: string,
  option: { logger: Logger; store: Store }
) => RepoFcn<any> = (entityName, { logger, store }) =>
  dispatcher<QueryDatabaseResponse, null>(
    ({ tx_id }) => action.deleteCommitByEntityName({ tx_id, args: { entityName } }),
    {
      name: 'deleteByEntityName',
      store,
      slice: 'query',
      SuccessAction: action.DELETE_SUCCESS,
      ErrorAction: action.DELETE_ERROR,
      logger,
    }
  );
