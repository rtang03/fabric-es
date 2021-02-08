import type { FTSearchParameters } from 'redis-modules-sdk';
import { Store } from 'redux';
import type { Logger } from 'winston';
import type { OutputCommit } from '../queryHandlerV2/types';
import { action } from '../store/query';
import type { HandlerResponse } from '../types';
import { dispatcher } from './dispatcher';

/**
 * @ignore
 */
export const queryFTSGetPaginatedCommit: (option: {
  logger: Logger;
  store: Store;
}) => (payload: {
  query: string;
  param: FTSearchParameters;
  countTotalOnly?: boolean;
}) => Promise<HandlerResponse<OutputCommit[]>> = ({ logger, store }) =>
  dispatcher<any, { query: string; param: FTSearchParameters; countTotalOnly: boolean }>(
    ({ tx_id, args: { query, param, countTotalOnly } }) =>
      action.cIdxSearch({
        tx_id,
        args: {
          query,
          param,
          countTotalOnly,
        },
      }),
    {
      name: `search-cidx`,
      store,
      slice: 'query',
      SuccessAction: action.SEARCH_SUCCESS,
      ErrorAction: action.SEARCH_ERROR,
      logger,
    }
  );
