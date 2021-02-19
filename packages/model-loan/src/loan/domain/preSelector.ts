import type { Commit } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { Loan, LoanInRedis } from '../types';

export const preSelector: Selector<[Loan, Commit[]], LoanInRedis> = createStructuredSelector({
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
