import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { Document } from '.';

export type PartialDocument = Pick<
  Document,
  'id' | 'ownerId' | 'loanId' | 'title' | 'reference' | 'status' | 'timestamp' | 'documentId'
>;

export type DocumentIndices = RedisearchDefinition<PartialDocument>;

/**
 * **documentIndices** list of indices of the domain entity *Document* available in the advance search.
 */
export const documentIndices: DocumentIndices = {
  id: { index: { type: 'TEXT', sortable: true } },
  documentId: { altName: 'docId' },
  ownerId: { altName: 'owner', index: { type: 'TEXT', sortable: true } },
  loanId: { index: { type: 'TEXT' } },
  title: { index: { type: 'TEXT' } },
  status: { index: { type: 'TEXT' } },
  reference: { altName: 'ref' },
  timestamp: { altName: 'ts', index: { type: 'NUMERIC', sortable: true } },
};
