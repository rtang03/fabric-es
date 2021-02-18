import { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { Document } from './document';

export type PartialDocument = Pick<
  Document,
  | 'id'
  | 'ownerId'
  | 'loanId'
  | 'title'
  | 'reference'
  | 'status'
  | 'timestamp'
  | 'documentId'
  | 'link' // <== newly added field
>;

export type DocumentIndexDefinition = RedisearchDefinition<PartialDocument>;
