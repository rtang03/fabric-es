import type { Store } from 'redux';
import type { Logger } from 'winston';
import type { HandlerResponse, Paginated } from '../types';
import { getPaginated } from './getPaginated';
import { queryFTSGetPaginated } from './queryFTSGetPaginated';

/**
 * perform search
 * @ignore
 */
export const doPaginatedFullTextSearch: <TResult = any>(
  index: 'cidx' | 'eidx',
  option: { store: Store; logger: Logger }
) => (
  query: string[],
  cursor: number,
  pagesize: number
) => Promise<HandlerResponse<Paginated<TResult>>> = <TResult>(index, option) => async (
  query,
  cursor,
  pagesize
) => {
  const total = await queryFTSGetPaginated(index, option)({ query, cursor: 0, pagesize: 0 });

  const paginated = await queryFTSGetPaginated(index, option)({ query, cursor, pagesize });

  return total?.status !== 'OK'
    ? { status: 'ERROR', error: total.error, message: total.message }
    : paginated?.status !== 'OK'
    ? { status: 'ERROR', error: paginated.error, message: paginated.message }
    : {
        status: 'OK',
        data: getPaginated<TResult>(paginated.data, total.data, cursor),
      };
};
