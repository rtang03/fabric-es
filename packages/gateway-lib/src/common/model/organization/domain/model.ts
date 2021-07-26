import type { BaseEntity } from '@fabric-es/fabric-cqrs';

/**
 * @ignore
 */
export const ORGAN_NAME = 'organization';

export enum OrgStatus {
  UP, DOWN
}

/**
 * @about **organization** is one of the on-chain top-level entities representing the organization participating in the blockchain network.
 */
export class Organization implements BaseEntity {
  static readonly entityName = ORGAN_NAME;

  id: string;
  mspId: string;
  name: string;
  url?: string;
  pubkey?: string;
  status: OrgStatus;
  timestamp: number;
  // _ts: number;
  // _created: number;
  // _creator: string;
}
