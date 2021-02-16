import type {
  Commit,
  QueryHandler,
  RedisRepository,
  Reducer,
  RedisearchDefinition,
} from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';

export interface AddQHRedisRepository {
  run: () => Promise<QueryHandlerService>;
  addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
    entityName: string;
    fields: RedisearchDefinition<TInput>;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
  }) => this;
}

export type QueryHandlerService = {
  addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
    entityName: string;
    fields: RedisearchDefinition<TInput>;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
  }) => AddQHRedisRepository;
  getEntityNames: () => string[];
  getQueryHandler: () => QueryHandler;
  getRedisRepos: () => Record<string, RedisRepository>;
  getReducers: () => Record<string, Reducer>;
  isReady: () => boolean;
  run: () => Promise<QueryHandlerService>;
  publisher: Redisearch;
  getServer: () => ApolloServer;
  shutdown: () => Promise<void>;
};
