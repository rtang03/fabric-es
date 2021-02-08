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
  dispatcher<any, { creator: string; entityName: string; id: string; commitId: string }>(
    ({ tx_id, args: { creator, entityName, id, commitId } }) =>
      action.notify({ tx_id, args: { creator, entityName, id, commitId } }),
    {
      name: 'queryNotify',
      store,
      slice: 'query',
      SuccessAction: action.NOTIFY_SUCCESS,
      ErrorAction: action.NOTIFY_ERROR,
      logger,
    }
  );
