import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { HandlerResponse } from '../types';
import { dispatcher } from './dispatcher';

/**
 * @ignore
 */
export const queryFTSGetPaginated: (
  index: 'cidx' | 'eidx',
  option: {
    logger: Logger;
    store: Store;
  }
) => (payload: {
  query: string[];
  cursor: number;
  pagesize: number;
}) => Promise<HandlerResponse> = (index, { logger, store }) => {
  const search = index === 'cidx' ? action.cIdxSearch : action.eIdxSearch;

  return dispatcher<any, { query: string[]; cursor: number; pagesize: number }>(
    ({ tx_id, args: { query, cursor, pagesize } }) => {
      return search({
        tx_id,
        args: {
          query: [...query, 'SORTBY', 'ts', 'DESC', 'LIMIT', cursor, pagesize],
          countTotalOnly: cursor === 0 && pagesize === 0,
        },
      });
    },
    {
      name: `search-${index}`,
      store,
      slice: 'query',
      SuccessAction: action.SEARCH_SUCCESS,
      ErrorAction: action.SEARCH_ERROR,
      logger,
    }
  );
};
