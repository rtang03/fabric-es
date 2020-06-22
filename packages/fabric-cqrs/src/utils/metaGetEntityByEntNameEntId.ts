import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { HandlerResponse } from '../types';
import { dispatcher } from './dispatcher';

/**
 * Pagination: get Entity from indexed content
 * NOTE: the returning entity includes meta data
 * @param entityName
 * @param id
 * @param logger
 * @param store
 */
export const metaGetEntityByEntNameEntId: <TEntity>(
  entityName: string,
  id: string,
  option: { logger: Logger; store: Store }
) => (payload: {
  cursor: number;
  pagesize: number;
  sortByField: 'id' | 'key' | 'created' | 'creator' | 'ts';
  sort: 'ASC' | 'DESC';
}) => Promise<HandlerResponse<TEntity[]>> = <TEntity>(entityName, id, { logger, store }) =>
  dispatcher<TEntity[], { cursor: number; pagesize: number; sortByField: string }>(
    ({ tx_id, args: { cursor, pagesize, sortByField, sort } }) =>
      action.eIdxSearch({
        tx_id,
        args: {
          query: [
            id ? `@entname:${entityName} @id:${id}` : `@entname:${entityName}`,
            'SORTBY',
            sortByField,
            sort,
            'LIMIT',
            cursor,
            pagesize,
          ],
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
