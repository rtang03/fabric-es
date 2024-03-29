import type { BaseOutputEntity } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { DocumentInCache } from '.';

/**
 * **DocumentOutput** represents the advance search result transformed from the domain entity *Document*.
 * It is optional if the output object has the same structure as the entity stored in Redis.
 */
export class DocumentOutput implements BaseOutputEntity {
  id: string;
  documentId: string;
  ownerId: string;
  loanId: string;
  title: string;
  reference: string;
  status: string;
  timestamp: number;
};

/**
 * **documentPostSelector** transform the domain entity cached in Redis into search result format.
 */
export const documentPostSelector: Selector<DocumentInCache, DocumentOutput> = createStructuredSelector({
  id: (item) => item?.id,
  documentId: (item) => item?.id,
  ownerId: (item) => item?.owner,
  loanId: (item) => item?.loanId,
  title: (item) => item?.title,
  reference: (item) => item?.ref,
  status: (item) => item?.status,
  timestamp: (item) => item?.timestamp,
});
