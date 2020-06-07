import { QueryDatabase, QueryHandler } from '@fabric-es/fabric-cqrs';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import type { Redis } from 'ioRedis';

export interface QueryHandlerGqlCtx {
  pubSub?: RedisPubSub;
  queryHandler: QueryHandler;
  queryDatabase?: QueryDatabase;
  publisher: Redis;
}
