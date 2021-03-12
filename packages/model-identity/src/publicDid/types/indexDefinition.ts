import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { DidDocument } from './didDocument';

export type PartialDidDocument = Pick<
  DidDocument,
  | 'id'
  | 'context'
  | 'controller'
  | 'verificationMethod'
  | 'service'
  | 'proof'
  | 'keyAgreement'
  | '_ts'
  >;

export type DerivedField = {
  created: string;
  updated: string;
};

export type DidDocumentIndexDefinition = RedisearchDefinition<PartialDidDocument & DerivedField>;
