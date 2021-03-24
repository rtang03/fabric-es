import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import { Identifier } from './identifier';

export type IdentifierIndexDefinition = RedisearchDefinition<
  Pick<
    Identifier,
    'id' | 'type' | 'ownerId' | 'attribute' | 'allSignatureValid' | 'activated' | '_ts'
    >
  >;
