import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { Document } from '.';

export type CommonDocumentFields = Pick<
  Document,
  'id' | 'ownerId' | 'loanId' | 'title' | 'reference' | 'status' | 'timestamp'
>;

export type DocumentIndexDefinition = RedisearchDefinition<CommonDocumentFields>;
