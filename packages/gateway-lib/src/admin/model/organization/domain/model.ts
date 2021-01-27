import type { BaseMetaEntity } from '@fabric-es/fabric-cqrs';

export enum OrgStatus {
  UP, DOWN
}

/**
 * @about **organization** is one of the on-chain top-level entities representing the organization participating in the blockchain network.
 */
export interface Organization extends BaseMetaEntity {
  readonly entityName: 'organization';

  id: string;

  mspId: string;

  name: string;

  url?: string;

  status: OrgStatus;

  timestamp: number;
}
