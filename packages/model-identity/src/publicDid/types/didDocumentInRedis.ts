import type { BaseCacheEntity } from '@fabric-es/fabric-cqrs';

export class DidDocumentInRedis implements BaseCacheEntity {
  publickey: string;
  context: string;
  controller: string;
  id: string;
  keyagr: string;
  proof: string;
  service: string;
  ts?: number;
  created?: number;
}
