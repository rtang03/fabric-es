import type { FTSearchParameters } from 'redis-modules-sdk';
import { Store } from 'redux';
import type { Logger } from 'winston';
import { action } from '../store/query';
import type { HandlerResponse, Paginated } from '../types';
import { dispatcher } from './dispatcher';
import { getPaginated } from './getPaginated';

type TArg = {
  entityName?: string;
  query: string;
  param: FTSearchParameters;
  countTotalOnly?: boolean;
};

const dispatchSearch: <TResult, TArg>(option: {
  logger: Logger;
  store: Store;
}) => (arg: TArg) => Promise<HandlerResponse<TResult>> = <TResult, TArg>({ logger, store }) =>
  dispatcher<TResult, TArg>(
    (arg) => (arg?.args?.entityName ? action.eIdxSearch(arg) : action.cIdxSearch(arg)),
    {
      name: `search`,
      store,
      slice: 'query',
      SuccessAction: action.SEARCH_SUCCESS,
      ErrorAction: action.SEARCH_ERROR,
      logger,
    }
  );

export const queryFullTextSearch: <TItem>(option: {
  store: Store;
  logger: Logger;
  query: string;
  param: FTSearchParameters;
  cursor: number;
  pagesize: number;
  entityName?: string;
}) => Promise<HandlerResponse<Paginated<TItem>>> = async <TItem>({
  entityName,
  store,
  logger,
  query,
  param,
  cursor,
  pagesize,
}) => {
  const total = await dispatchSearch<TItem[], TArg>({ store, logger })({
    entityName,
    query,
    param: { limit: { first: 0, num: 0 } },
    countTotalOnly: true,
  });

  const _param = entityName
    ? {
        sortBy: { sort: 'DESC', field: 'ts' },
        ...param,
        limit: { first: cursor, num: pagesize },
      }
    : {
        // sorty timestamp can be overriden by input argument "param"
        ...{ sortBy: { sort: 'DESC', field: 'ts' } },
        ...param,
        // input argument "cursor" and "pagesize" is final
        ...{ limit: { first: cursor, num: pagesize } },
      };

  const paginated = await dispatchSearch<TItem[], TArg>({ store, logger })({
    entityName,
    query,
    param: _param,
  });

  return total?.status !== 'OK'
    ? { status: 'ERROR', error: total?.error, message: total?.message }
    : paginated?.status !== 'OK'
    ? { status: 'ERROR', error: paginated?.error, message: paginated?.message }
    : {
        status: 'OK',
        data: getPaginated<TItem>(paginated.data, total.data, cursor),
      };
};
