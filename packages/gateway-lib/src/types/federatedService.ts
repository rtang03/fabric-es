import type { PrivateRepository, Reducer, Repository } from '@fabric-es/fabric-cqrs';
import type { Commit, RedisearchDefinition, RedisRepository } from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import type { Selector } from 'reselect';

export interface AddRedisRepository {
  addRepository: <TEntity, TEvent>(entityName: string, reducer: Reducer<TEntity>) => AddRepository;
  addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
    entityName: string;
    fields: RedisearchDefinition<TInput>;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
  }) => this;
}

interface AddRepository {
  create: (option?: {
    mspId?: string;
    playground?: boolean;
    introspection?: boolean;
  }) => ApolloServer;
  addRepository: <TEntity, TEvent>(entityName: string, reducer: Reducer<TEntity>) => this;
  addPrivateRepository: <TEntity, TEvent>(
    entityName: string,
    reducer: Reducer<TEntity>,
    parentName?: string
  ) => AddPrivateRepository;
}

interface AddPrivateRepository {
  create: (option?: {
    mspId?: string;
    playground?: boolean;
    introspection?: boolean;
  }) => ApolloServer;
  addPrivateRepository: <TEntity, TEvent>(
    entityName: string,
    reducer: Reducer<TEntity>,
    parentName?: string
  ) => this;
}

export type FederatedService = {
  config: (option: {
    typeDefs: any;
    resolvers: any;
  }) => {
    addRepository: <TEntity, TEvent>(
      entityName: string,
      reducer: Reducer<TEntity>
    ) => AddRepository;
    // addRepository: (repository: Repository | PrivateRepository) => AddRepository;
    addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
      entityName: string;
      fields: RedisearchDefinition<TInput>;
      preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
      postSelector?: Selector<TItemInRedis, TOutput>;
    }) => AddRedisRepository;
  };
  disconnect: () => void;
  getMspId: () => string;
  getRedisRepos: () => Record<string, RedisRepository>;
  getRepository: <TEntity, TEvent>(
    entityName: string,
    reducer: Reducer
  ) => Repository<TEntity, TEvent>;
  getPrivateRepository: <TEntity, TEvent>(
    entityName: string,
    reducer: Reducer,
    parentName?: string
  ) => PrivateRepository<TEntity, TEvent>;
  getServiceName: () => string;
  shutdown: (server: ApolloServer) => Promise<void>;
};
