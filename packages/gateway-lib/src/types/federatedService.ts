import type {
  PrivateRepository, Repository, Commit, RedisearchDefinition, RedisRepository, EntityType, ReducerCallback,
} from '@fabric-es/fabric-cqrs';
import type {  } from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { GraphQLSchema } from 'graphql';
import type { Selector } from 'reselect';

export interface AddRedisRepository {
  addRepository: <TEntity, TEvent>(entity: EntityType<TEntity>, reducer: ReducerCallback<TEntity, TEvent>) => AddRepository;
  addRedisRepository: <TInput, TItemInRedis, TOutput>(
    entity: EntityType<TInput>,
    option: {
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
  addRepository: <TEntity, TEvent>(
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>
  ) => this;
  addPrivateRepository: <TEntity, TEvent>(
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>,
  ) => AddPrivateRepository;
}

interface AddPrivateRepository {
  create: (option?: {
    mspId?: string;
    playground?: boolean;
    introspection?: boolean;
  }) => ApolloServer;
  addPrivateRepository: <TEntity, TEvent>(
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>,
  ) => this;
}

export type FederatedService = {
  config: (schema: GraphQLSchema) => {
    addPrivateRepository: <TEntity, TEvent>(
      entity: EntityType<TEntity>,
      reducer: ReducerCallback<TEntity, TEvent>,
    ) => AddPrivateRepository;
    addRepository: <TEntity, TEvent>(
      entity: EntityType<TEntity>,
      reducer: ReducerCallback<TEntity, TEvent>,
    ) => AddRepository;
    addRedisRepository: <TInput, TItemInRedis, TOutput>(
      entity: EntityType<TInput>,
      option: {
        fields: RedisearchDefinition<TInput>;
        preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
        postSelector?: Selector<TItemInRedis, TOutput>;
    }) => AddRedisRepository;
  };
  disconnect: () => void;
  getMspId: () => string;
  getRedisRepos: () => Record<string, RedisRepository>;
  getRepository: <TEntity, TEvent>(
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>
  ) => Repository<TEntity, TEvent>;
  getPrivateRepository: <TEntity, TEvent>(
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>
  ) => PrivateRepository<TEntity, TEvent>;
  getServiceName: () => string;
  shutdown: (server: ApolloServer) => Promise<void>;
};
