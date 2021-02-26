import type { Commit } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { Document } from '.';

/**
 * **DocumentInRedis** represents the domain entity *Document* cached in Redis for quick access and advance searching.
 * It is optional if the object stored in Redis has the same structure as the domain entity.
 */
export type DocumentInRedis = {
  id: string;
  owner: string;
  loanId: string;
  title: string;
  status: string;
  ref: string;
  ts: number;
  created: number;
  creator: string;
};

/**
 * **documentPreSelector** transform the domain entity *Document* into the cached version in Redis.
 */
export const documentPreSelector: Selector<
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
