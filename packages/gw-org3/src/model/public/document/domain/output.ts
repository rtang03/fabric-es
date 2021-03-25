import type { DocumentOutput as SuperOutputDocument } from '@fabric-es/model-document';
import { createStructuredSelector, Selector } from 'reselect';
import type { DocumentInCache } from '.';

export interface DocumentOutput extends SuperOutputDocument {
  link: string;
}

export const documentPostSelector: Selector<DocumentInCache, DocumentOutput> = createStructuredSelector({
  id: (item) => item?.id,
  documentId: (item) => item?.id,
  ownerId: (item) => item?.owner,
  loanId: (item) => item?.loanId,
  title: (item) => item?.title,
  reference: (item) => item?.ref,
  status: (item) => item?.status,
  timestamp: (item) => item?.timestamp,
  link: (item) => item?.link, // new field
});