import type { Commit } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { Document, DocumentInRedis } from '../types';

export const preSelector: Selector<
  [Document, Commit[]],
  DocumentInRedis
> = createStructuredSelector({
  id: ([{ id }]) => id,
  owner: ([{ ownerId }]) => ownerId,
  ref: ([{ reference }]) => reference,
  loanId: ([{ loanId }]) => loanId,
  title: ([{ title }]) => title,
  status: ([{ status }]) => status.toString(),
  ts: ([{ timestamp }]) => timestamp,
  created: ([{ _created }]) => _created,
  creator: ([{ _creator }]) => _creator,
});
