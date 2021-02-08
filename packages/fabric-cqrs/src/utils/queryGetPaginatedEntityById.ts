import { Store } from 'redux';
import type { Logger } from 'winston';
import { tokenizeTextField } from '../queryHandler';
import { action } from '../store/query';
import type { HandlerResponse, PaginatedEntityCriteria } from '../types';
import { dispatcher } from './dispatcher';

/**
 * Pagination: get Entity from indexed content
 * NOTE: the returning entity includes meta data
 * @ignore
 */
export const queryGetPaginatedEntityById: <TResult>(
  entityName: string,
  id: string,
  option: { logger: Logger; store: Store }
) => (payload: PaginatedEntityCriteria) => Promise<HandlerResponse<TResult>> = <TResult>(
  entityName,
  id,
  { logger, store }
) => {
  const query = id ? `@type:${entityName} @id:${id}` : `@type:${entityName}`;
  const getRangedQuery = (
    startTime: number,
    endTime: number,
    scope,
    creator: string,
    org: string
  ) => {
    let q = query;

    startTime >= 0 &&
      scope === 'LAST_MODIFIED' &&
      (q = `${q} @ts:[${startTime} ${endTime || 'inf'}]`);

    startTime >= 0 &&
      scope === 'CREATED' &&
      (q = `${q} @created:[${startTime} ${endTime || 'inf'}]`);

    creator && (q = `${q} @creator:${tokenizeTextField(creator)}`);

    org && (q = `${q} @org:{${org}}`);

    return q;
  };

  return dispatcher<TResult, PaginatedEntityCriteria>(
    ({
      tx_id,
      args: {
        startTime,
        endTime,
        scope,
        creator,
        cursor,
        pagesize,
        sortByField,
        sort,
        organization,
      },
    }) =>
      action.eIdxSearch({
        tx_id,
        args: {
          entityName,
          query,
          param: {
            filter: {
              field: 'ts',
              min: startTime,
              max: endTime,
            },
            sortBy: {
              sort,
              field: sortByField,
            },
            limit: {
              first: cursor,
              num: pagesize,
            },
          },
          // query: [
          //   getRangedQuery(startTime, endTime, scope, creator, organization),
          //   'SORTBY',
          //   sortByField || 'id',
          //   sort || 'ASC',
          //   'LIMIT',
          //   cursor,
          //   pagesize,
          // ],
          countTotalOnly: cursor === 0 && pagesize === 0,
        },
      }),
    {
      name: 'queryGetPaginatedEntityById',
      store,
      slice: 'query',
      SuccessAction: action.SEARCH_SUCCESS,
      ErrorAction: action.SEARCH_ERROR,
      logger,
    }
  );
};
