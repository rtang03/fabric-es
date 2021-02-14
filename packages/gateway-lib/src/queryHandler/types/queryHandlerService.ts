import type {
  Commit,
  QueryHandler,
  RedisRepository,
  Reducer,
  RedisearchDefinition,
  QueryDatabase,
} from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';

export type QueryHandlerService = {
  addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
    entityName: string;
    fields: RedisearchDefinition<TInput>;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
  }) => void;
  getEntityNames: () => string[];
  getQueryHandler: () => QueryHandler;
  getRedisRepos: () => Record<string, RedisRepository>;
  getReducers: () => Record<string, Reducer>;
  isReady: () => boolean;
  prepare: () => Promise<void>;
  publisher: Redisearch;
  server: ApolloServer;
  shutdown: () => Promise<void>;
};
