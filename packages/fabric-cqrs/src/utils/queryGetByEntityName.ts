import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { RepoFcn, Reducer } from '../types';
import { dispatcher } from './dispatcher';
import { commitsToGroupByEntityId } from './queryHandler';

export const queryGetByEntityName: <TEntity>(
  entityName: string,
  reducer: Reducer,
  option: { logger: Logger; store: Store }
) => RepoFcn<TEntity[]> = <TEntity>(entityName, reducer, { logger, store }) =>
  dispatcher<TEntity[], null>(
    ({ tx_id }) => action.queryByEntityName({ tx_id, args: { entityName } }),
    {
      name: 'getByEntityName',
      store,
      slice: 'query',
      SuccessAction: action.QUERY_SUCCESS,
      ErrorAction: action.QUERY_ERROR,
      logger,
    },
    (commits) =>
      commits ? commitsToGroupByEntityId<TEntity>(commits, reducer).currentStates : null
  );
