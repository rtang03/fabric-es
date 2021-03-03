import { createStructuredSelector, Selector } from 'reselect';
import type { DocumentInRedis } from '.';

/**
 * **DocumentOutput** represents the advance search result transformed from the domain entity *Document*.
 * It is optional if the output object has the same structure as the entity stored in Redis.
 */
export type DocumentOutput = {
  id: string;
  documentId: string;
  ownerId: string;
  loanId: string;
  title: string;
  reference: string;
  status: string;
  timestamp: number;
  creator: string;
  createdAt: number;
  organization: string[];
};

/**
 * **documentPostSelector** transform the domain entity cached in Redis into search result format.
 */
export const documentPostSelector: Selector<DocumentInRedis, DocumentOutput> = createStructuredSelector({
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
  organization: (item) => item?.organ,
});
