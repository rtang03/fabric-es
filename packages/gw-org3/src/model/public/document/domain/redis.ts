import type { Commit } from '@fabric-es/fabric-cqrs';
import type { DocumentInRedis as SuperDocumentInRedis } from '@fabric-es/model-document';
import { createStructuredSelector, Selector } from 'reselect';
import type { Document } from '.';

export interface DocumentInRedis extends SuperDocumentInRedis {
  link: string;
}

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
  link: ([{ link }]) => link, // new field
  organ: ([{ _organization }]) => JSON.stringify(_organization),
});
