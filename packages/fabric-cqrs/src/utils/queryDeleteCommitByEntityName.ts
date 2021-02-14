import { Store } from 'redux';
import type { Logger } from 'winston';
import type { QueryDatabaseResponse } from '../queryHandler/types';
import { action } from '../store/query';
import type { RepoFcn } from '../types';
import { dispatcher } from './dispatcher';

/**
 * delete commit by entityName
 * Basic Query-side Operation
 * @ignore
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
