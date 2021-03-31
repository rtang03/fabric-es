import type { Commit, BaseCacheEntity } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { Loan } from '.';

/**
 * **LoanInCache** it is the representation of the domain entity *Loan* cached in Redis. It is optional if the object stored in Redis
 * has the same structure as the domain entity *AND* only contains primitive data types.
 * Possible usage:
 * - splitting a domain entity field into multiple fields for advance searching (e.g. range search) on all (or some) of these derived fields.
 */
export class LoanInCache implements BaseCacheEntity {
  id: string;
  owner: string;
  de: string;
  ref: string;
  status: string;
  comment: string;
  timestamp: number;
};

/**
 * **loanPreSelector** transform the domain entity *Loan* into the cached version in Redis.
 */
export const loanPreSelector: Selector<[Loan, Commit[]], LoanInCache> = createStructuredSelector({
  id: ([{ id }]) => id,
  owner: ([{ ownerId }]) => ownerId,
  de: ([{ description }]) => description,
  comment: ([{ comment }]) => comment,
  ref: ([{ reference }]) => reference,
  status: ([{ status }]) => status.toString(),
  timestamp: ([{ timestamp }]) => timestamp,
});