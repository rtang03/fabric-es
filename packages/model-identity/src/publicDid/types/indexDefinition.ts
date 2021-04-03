import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { DidDocument } from '../../types';

export type PartialDidDocument = Pick<
  DidDocument,
  'id' | 'context' | 'controller' | 'publicKey' | 'service' | 'proof' | 'keyAgreement' | 'updated'
>;

export type DidDocumentIndexDefinition = RedisearchDefinition<PartialDidDocument>;
