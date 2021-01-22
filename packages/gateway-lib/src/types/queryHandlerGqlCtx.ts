import { QueryDatabase, QueryHandler } from '@fabric-es/fabric-cqrs';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

/**
 * @about apollo context for QueryHandler
 */
export type QueryHandlerGqlCtx = {
  pubSub?: RedisPubSub;
  queryHandler: QueryHandler;
  queryDatabase?: QueryDatabase;
  publisher: Redis.Redis;
  user_id?: string;
  is_admin?: boolean;
  username?: string;
  entityNames: string[];
};
