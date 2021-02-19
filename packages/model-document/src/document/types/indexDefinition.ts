import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { Document } from '.';

export type PartialDocument = Pick<
  Document,
  'id' | 'ownerId' | 'loanId' | 'title' | 'reference' | 'status' | 'timestamp' | 'documentId'
>;

export type DocumentIndexDefinition = RedisearchDefinition<PartialDocument>;
