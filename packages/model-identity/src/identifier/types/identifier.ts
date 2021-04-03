import type { BaseEntity } from '@fabric-es/fabric-cqrs';

export type IdentifierAttribute = {
  key: string;
  value: string;
  description?: string;
};

export class Identifier implements BaseEntity {
  id: string;
  type: string;
  ownerId: string;
  attribute: IdentifierAttribute[];
  allSignatureValid?: boolean;
  activated?: boolean;
  _ts: number;
}
