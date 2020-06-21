import { Store } from 'redux';
import { Logger } from 'winston';
import { action } from '../store/query';
import type { RepoFcn_find } from '../types';
import { dispatcher } from './dispatcher';

/**
 * FindBy operation
 * TODO: "where" clause is currently limited to "where: { id }". Need improvement
 * @param entityName
 * @param store
 * @param logger
 */
export const queryFind: <TEntity>(
  entityName: string,
  option: { logger: Logger; store: Store }
) => RepoFcn_find<TEntity[]> = <TEntity>(entityName, { store, logger }) =>
  dispatcher<TEntity[], { byId: string; byDesc: string; where: any }>(
    ({ tx_id, args: { byId, byDesc, where } }) =>
      action.find({ tx_id, args: { byId, byDesc, entityName, where } }),
    {
      name: 'find',
      store,
      slice: 'query',
      SuccessAction: action.FIND_SUCCESS,
      ErrorAction: action.FIND_ERROR,
      logger,
    }
  );
