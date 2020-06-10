import { Store } from 'redux';
import { Logger } from 'winston';
import { action } from '../store/query';
import type { RepoFcn_find } from '../types';
import { dispatcher } from './dispatcher';

export const queryFind: <TEntity>(
  entityName: string,
  option: { logger: Logger; store: Store }
) => RepoFcn_find<Record<string, TEntity>> = <TEntity>(entityName, { store, logger }) =>
  dispatcher<Record<string, TEntity>, { byId: string; byDesc: string }>(
    ({ tx_id, args: { byId, byDesc } }) =>
      action.find({ tx_id, args: { byId, byDesc, entityName } }),
    {
      name: 'find',
      store,
      slice: 'query',
      SuccessAction: action.FIND_SUCCESS,
      ErrorAction: action.FIND_ERROR,
      logger,
    }
  );
