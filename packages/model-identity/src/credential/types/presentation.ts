import type { BaseEntity } from '@fabric-es/fabric-cqrs';
import type { VerificableCredential } from './credential';

export interface Presentation extends BaseEntity {
  context: 'https://w3id.org/did/v1' | string | string[];

  id: string;

  type: string[];

  holder?: any;

  verifiableCredential: VerificableCredential[];
}
