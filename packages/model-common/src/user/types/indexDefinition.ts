import type { RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import type { User } from './user';

export type UserIndexDefinition = RedisearchDefinition<User>;
