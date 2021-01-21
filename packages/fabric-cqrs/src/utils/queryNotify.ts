import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import { HandlerResponse } from '../types';
import { dispatcher } from './dispatcher';

/**
 * query side: query notification details
 * @ignore
 */
export const queryNotify: (option: {
  store: Store;
  logger: Logger;
}) => () => Promise<HandlerResponse> = ({ store, logger }) =>
  dispatcher<
    any,
    { creator: string; entityName: string; id: string; commitId: string; expireNow: boolean }
  >(
    ({ tx_id, args: { creator, entityName, id, commitId, expireNow } }) =>
      action.notify({ tx_id, args: { creator, entityName, id, commitId, expireNow } }),
    {
      name: 'queryNotify',
      store,
      slice: 'query',
      SuccessAction: action.NOTIFY_SUCCESS,
      ErrorAction: action.NOTIFY_ERROR,
      logger,
    }
  );
