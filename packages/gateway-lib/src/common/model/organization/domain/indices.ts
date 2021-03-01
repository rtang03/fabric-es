import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { Organization } from './model';

export type PartialOrganization = Pick<
Organization,
  'id' | 'mspId' | 'name' | 'url' | 'status' | 'timestamp'
>;

export type OrgIndices = RedisearchDefinition<PartialOrganization>;

export const orgIndices: OrgIndices = {
  id: { index: { type: 'TEXT', sortable: true } },
  mspId: { index: { type: 'TEXT', sortable: true } },
  name: { index: { type: 'TEXT', sortable: true } },
  url: { altName: 'ref' },
  status: { index: { type: 'TEXT' } },
  timestamp: { altName: 'ts', index: { type: 'NUMERIC', sortable: true } },
};
