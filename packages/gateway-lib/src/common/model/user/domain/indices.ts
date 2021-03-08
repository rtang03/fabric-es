import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { User } from '..';

export type UserIndices = RedisearchDefinition<User>;

export const userIndices: UserIndices = {
  id: { index: { type: 'TEXT', sortable: true } },
  name: { index: { type: 'TEXT', sortable: true } },
  userId: { index: { type: 'TEXT', sortable: true } },
};
