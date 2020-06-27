import type { Store } from 'redux';
import type { Logger } from 'winston';
import type {
  HandlerResponse,
  Paginated,
  PaginatedCommitCriteria,
  PaginatedEntityCriteria,
} from '../types';
import { getPaginated } from './getPaginated';

export const doPaginatedSearch: <
  TResult,
  TCriteria extends PaginatedEntityCriteria | PaginatedCommitCriteria
>(
  entityName: string,
  fcn: Function,
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
    ? { error: total.error, message: total.message }
    : paginated.status !== 'OK'
    ? { error: paginated.error, message: paginated.message }
    : { data: getPaginated<TResult>(paginated.data, total.data, criteria.cursor) };
};
