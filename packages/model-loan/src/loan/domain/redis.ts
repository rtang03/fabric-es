import type { Commit } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { Loan } from '.';

/**
 * **LoanInRedis** represents the domain entity *Loan* cached in Redis for quick access and advance searching.
 * It is optional if the object stored in Redis has the same structure as the domain entity.
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
});