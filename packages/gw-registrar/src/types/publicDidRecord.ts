import type { BaseEntity } from '@fabric-es/fabric-cqrs';

export class PublicDidRecord implements BaseEntity {
  id: string;
  origin: string;
  status: string[];
  _ts: number;
}
