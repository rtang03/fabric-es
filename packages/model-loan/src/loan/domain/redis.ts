import type { Commit } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { Loan } from '.';

/**
 * **LoanInRedis** it is the representation of the domain entity *Loan* cached in Redis. It is optional if the object stored in Redis
 * has the same structure as the domain entity *AND* only contains primitive data types.
 * Possible usage:
 * - splitting a domain entity field into multiple fields for advance searching (e.g. range search) on all (or some) of these derived fields.
 */
export type LoanInRedis = {
  id: string;
  owner: string;
  de: string;
  ref: string;
  status: string;
  comment: string;
  ts: number;
  created: number;
  creator: string;
  organ: string;
};

/**
 * **loanPreSelector** transform the domain entity *Loan* into the cached version in Redis.
 */
export const loanPreSelector: Selector<[Loan, Commit[]], LoanInRedis> = createStructuredSelector({
  id: ([{ id }]) => id,
  owner: ([{ ownerId }]) => ownerId,
  de: ([{ description }]) => description,
  comment: ([{ comment }]) => comment,
  ref: ([{ reference }]) => reference,
  status: ([{ status }]) => status.toString(),
  ts: ([{ timestamp }]) => timestamp,
  created: ([{ _created }]) => _created,
  creator: ([{ _creator }]) => _creator,
  organ: ([{ _organization }]) => JSON.stringify(_organization),
});