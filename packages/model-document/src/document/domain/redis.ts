import type { Commit, BaseCacheEntity } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { Document } from '.';

/**
 * **DocumentInCache** it is the representation of the domain entity *Document* cached in Redis. It is optional if the object stored in Redis
 * has the same structure as the domain entity *AND* only contains primitive data types.
 * Possible usage:
 * - splitting a domain entity field into multiple fields for advance searching (e.g. range search) on all (or some) of these derived fields.
 */
export class DocumentInCache implements BaseCacheEntity {
  id: string;
  owner: string;
  loanId: string;
  title: string;
  status: string;
  ref: string;
  timestamp: number;
};

/**
 * **documentPreSelector** transform the domain entity *Document* into the cached version in Redis.
 */
export const documentPreSelector: Selector<
  [Document, Commit[]],
  DocumentInCache
> = createStructuredSelector({
  id: ([{ id }]) => id,
  owner: ([{ ownerId }]) => ownerId,
  ref: ([{ reference }]) => reference,
  loanId: ([{ loanId }]) => loanId,
  title: ([{ title }]) => title,
  status: ([{ status }]) => status.toString(),
  timestamp: ([{ timestamp }]) => timestamp,
});
