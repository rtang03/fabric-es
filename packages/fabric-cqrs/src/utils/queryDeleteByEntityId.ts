import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { QueryDatabaseResponse, RepoFcnId } from '../types';
import { dispatcher } from './dispatcher';

export const queryDeleteByEntityId: (
  entityName: string,
  option: { logger: Logger; store: Store }
) => RepoFcnId<any> = (entityName, { store, logger }) =>
  dispatcher<QueryDatabaseResponse, { id: string }>(
    ({ tx_id, args: { id } }) => action.deleteByEntityId({ tx_id, args: { id, entityName } }),
    {
      name: 'deleteByEntityId',
      store,
      slice: 'query',
      SuccessAction: action.DELETE_SUCCESS,
      ErrorAction: action.DELETE_ERROR,
      logger,
    }
  );
