import { Store } from 'redux';
import type { Logger } from 'winston';
import { commitsToGroupByEntityId } from '../queryHandlerV2';
import { action } from '../store/query';
import type { HandlerResponse, Reducer } from '../types';
import { dispatcher } from './dispatcher';

/**
 * retrieve commits and then reduce
 * NOTE: there is no meta data, like __commit, nor __event
 * @ignore
 */
export const queryGetEntityByEntityName: <TEntity>(
  entityName: string,
  reducer: Reducer,
  option: { logger: Logger; store: Store }
) => () => Promise<HandlerResponse<TEntity[]>> = <TEntity>(
  entityName,
  reducer,
  { logger, store }
) =>
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
