import { createStructuredSelector, Selector } from 'reselect';
import type { DocumentInRedis, OutputDocument } from '../types';

export const postSelector: Selector<DocumentInRedis, OutputDocument> = createStructuredSelector({
  entityName: () => 'document',
  id: (item) => item?.id,
  documentId: (item) => item?.id,
  ownerId: (item) => item?.owner,
  loanId: (item) => item?.loanId,
  title: (item) => item?.title,
  reference: (item) => item?.ref,
  status: (item) => item?.status,
  timestamp: (item) => item?.ts,
  createdAt: (item) => item?.created,
  creator: (item) => item?.creator,
});
