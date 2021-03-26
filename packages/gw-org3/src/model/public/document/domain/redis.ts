import type { Commit } from '@fabric-es/fabric-cqrs';
import type { DocumentInCache as SuperDocumentInCache } from '@fabric-es/model-document';
import { createStructuredSelector, Selector } from 'reselect';
import type { Document } from '.';

export interface DocumentInCache extends SuperDocumentInCache {
  link: string;
}

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
  link: ([{ link }]) => link, // new field
});
