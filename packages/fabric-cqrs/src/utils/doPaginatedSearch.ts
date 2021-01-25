import type { Store } from 'redux';
import type { Logger } from 'winston';
import type {
  HandlerResponse,
  Paginated,
  PaginatedCommitCriteria,
  PaginatedEntityCriteria,
} from '../types';
import { getPaginated } from './getPaginated';

/**
 * perform search
 * @ignore
 */
export const doPaginatedSearch: <
  TResult,
  TCriteria extends PaginatedEntityCriteria | PaginatedCommitCriteria
>(
  entityName: string,
  fcn: any,
  option: { logger: Logger; store: Store }
) => (criteria: TCriteria, id?: string) => Promise<HandlerResponse<Paginated<TResult>>> = <
  TResult,
  TCriteria
>(
  entityName,
  fcn,
  option
) => async (criteria, id) => {
  !criteria.cursor && (criteria.cursor = 0);
  !criteria.pagesize && (criteria.pagesize = 10);

  const total = await fcn(entityName, id, option)({ ...criteria, cursor: 0, pagesize: 0 });

  const paginated = await fcn(entityName, id, option)(criteria);

  return total.status !== 'OK'
    ? { status: 'ERROR', error: total.error, message: total.message }
    : paginated.status !== 'OK'
    ? { status: 'ERROR', error: paginated.error, message: paginated.message }
    : { status: 'OK', data: getPaginated<TResult>(paginated.data, total.data, criteria.cursor) };
};
