import type { FTSearchParameters } from 'redis-modules-sdk';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { HandlerResponse } from '../types';
import { dispatcher } from './dispatcher';

/**
 * @ignore
 */
export const queryFTSGetPaginatedEntity: <TOutputEntity>(option: {
  logger: Logger;
  store: Store;
}) => (payload: {
  entityName: string;
  query: string;
  param: FTSearchParameters;
  countTotalOnly?: boolean;
}) => Promise<HandlerResponse<TOutputEntity>> = ({ logger, store }) =>
  dispatcher<
    any,
    { entityName: string; query: string; param: FTSearchParameters; countTotalOnly: boolean }
  >(
    ({ tx_id, args: { entityName, query, param, countTotalOnly } }) =>
      action.eIdxSearch({
        tx_id,
        args: {
          entityName,
          query,
          param,
          countTotalOnly,
        },
      }),
    {
      name: `search-eidx`,
      store,
      slice: 'query',
      SuccessAction: action.SEARCH_SUCCESS,
      ErrorAction: action.SEARCH_ERROR,
      logger,
    }
  );
