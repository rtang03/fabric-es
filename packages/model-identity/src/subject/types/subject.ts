import type { BaseEntity } from '@fabric-es/fabric-cqrs';

export type ServiceEndpoint = {
  id: string;
  type: string;
  serviceEndpoint: string;
  description?: string;
};

export class Subject implements BaseEntity {
  id: string;
  service: ServiceEndpoint[];
  _ts: number;
}
