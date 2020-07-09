import { Store } from 'redux';
import type { Logger } from 'winston';
import { tokenizeTextField } from '../queryHandler';
import { action } from '../store/query';
import type { HandlerResponse, PaginatedCommitCriteria } from '../types';
import { dispatcher } from './dispatcher';

/**
 * Pagination: get Entity from indexed content
 * NOTE: the returning entity includes meta data
 * @param entityName
 * @param id
 * @param logger
 * @param store
 */
export const queryGetPaginatedCommitById: <TResult>(
  entityName: string,
  id: string,
  option: { logger: Logger; store: Store }
) => (payload: PaginatedCommitCriteria) => Promise<HandlerResponse<TResult>> = <TResult>(
  entityName,
  id,
  { logger, store }
) => {
  const query = id ? `@type:${entityName} @id:${id}` : `@type:${entityName}`;
  const getRangedQuery = (
    startTime: number,
    endTime: number,
    events: string[],
    creator: string
  ) => {
    const eventsString = events
      ? events.reduce((prev, curr) => (prev ? `${prev}|${curr}` : curr), null)
      : null;

    let q = query;

    startTime >= 0 && (q = `${q} @ts:[${startTime} ${endTime || 'inf'}]`);

    eventsString && (q = `${q} @event:{${eventsString}}`);

    creator && (q = `${q} @creator:${tokenizeTextField(creator)}`);

    return q;
  };

  return dispatcher<TResult, PaginatedCommitCriteria>(
    ({
      tx_id,
      args: { startTime, endTime, events, creator, cursor, pagesize, sortByField, sort },
    }) =>
      action.cIdxSearch({
        tx_id,
        args: {
          query: [
            getRangedQuery(startTime, endTime, events, creator),
            'SORTBY',
            sortByField || 'id',
            sort || 'ASC',
            'LIMIT',
            cursor,
            pagesize,
          ],
          countTotalOnly: cursor === 0 && pagesize === 0,
        },
      }),
    {
      name: 'queryGetPaginatedCommitById',
      store,
      slice: 'query',
      SuccessAction: action.SEARCH_SUCCESS,
      ErrorAction: action.SEARCH_ERROR,
      logger,
    }
  );
};
