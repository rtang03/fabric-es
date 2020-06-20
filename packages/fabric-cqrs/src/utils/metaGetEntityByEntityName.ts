import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { HandlerResponse } from '../types';
import { dispatcher } from './dispatcher';

/**
 * get Entity from indexed content
 * NOTE: the returning entity includes meta data
 * @param entityName
 * @param logger
 * @param store
 */
export const metaGetEntityByEntityName: <T>(
  entityName: string,
  option: { logger: Logger; store: Store }
) => (payload: {
  page: number;
  countPerPage: number;
  sortByField: 'id' | 'key' | 'created' | 'creator' | 'ts';
  sort: 'ASC' | 'DESC';
}) => Promise<HandlerResponse<T[]>> = <TEntity>(entityName, { logger, store }) =>
  dispatcher<TEntity[], { page: number; countPerPage: number; sortByField: string }>(
    ({ tx_id, args: { page, countPerPage, sortByField, sort } }) =>
      action.eIdxSearch({
        tx_id,
        args: {
          query: `@entname:${entityName} SORTBY ${sortByField} ${sort} ${page} ${countPerPage}`,
        },
      }),
    {
      name: 'metaGetEntityByEntityName',
      store,
      slice: 'query',
      SuccessAction: action.SEARCH_SUCCESS,
      ErrorAction: action.SEARCH_ERROR,
      logger,
    }
  );
