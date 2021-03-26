import type {
  PrivateRepository, Repository, Commit, RedisearchDefinition, RedisRepository, EntityType, ReducerCallback,
} from '@fabric-es/fabric-cqrs';
import type {  } from '@fabric-es/fabric-cqrs';
import { GraphQLResolverMap } from 'apollo-graphql';
import { ApolloServer } from 'apollo-server';
import { DocumentNode } from 'graphql';
import type { Selector } from 'reselect';

export enum ServiceType {
  Public,
  Private,
  Remote,
}

// export interface AddRedisRepository {
//   addRepository: <TEntity, TEvent>(entity: EntityType<TEntity>, reducer: ReducerCallback<TEntity, TEvent>) => AddRepository;
//   addRedisRepository: <TInput, TItemInRedis, TOutput>(
//     entity: EntityType<TInput>,
//     option: {
//       fields: RedisearchDefinition<TInput>;
//       preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
//       postSelector?: Selector<TItemInRedis, TOutput>;
//   }) => this;
// }

export interface AddRepository {
  create: (option?: {
    mspId?: string;
    playground?: boolean;
    introspection?: boolean;
  }) => ApolloServer;
  addRepository: <TEntity, TRedis, TOutput, TEvent>(
    entity: EntityType<TEntity>,
    option: {
      reducer: ReducerCallback<TEntity, TEvent>;
      fields: RedisearchDefinition<TEntity>;
      preSelector?: Selector<[TEntity, Commit[]?], TRedis>;
      postSelector?: Selector<TRedis, TOutput>;
    }
  ) => this;
  addPrivateRepository: <TEntity, TEvent>(
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>,
  ) => AddPrivateRepository;
}

export interface AddRemoteRepository {
  create: (option?: {
    mspId?: string;
    playground?: boolean;
    introspection?: boolean;
  }) => ApolloServer;
  addRemoteRepository: <TParent, TEntity, TRedis, TOutput, TEvent>(
    parent: EntityType<TParent>,
    entity: EntityType<TEntity>,
    option: {
      reducer: ReducerCallback<TParent, TEvent>;
      fields: RedisearchDefinition<TParent>;
      preSelector?: Selector<[TParent, Commit[]?], TRedis>;
      postSelector?: Selector<TRedis, TOutput>;
    }
  ) => this;
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
  config: (sdl: {
    typeDefs: DocumentNode;
    resolvers: GraphQLResolverMap<any>;
  }[]) => {
    addPrivateRepository: <TEntity, TEvent>(
      entity: EntityType<TEntity>,
      reducer: ReducerCallback<TEntity, TEvent>,
    ) => AddPrivateRepository;
    addRepository: <TEntity, TRedis, TOutput, TEvent>(
      entity: EntityType<TEntity>,
      option: {
        reducer: ReducerCallback<TEntity, TEvent>;
        fields: RedisearchDefinition<TEntity>;
        preSelector?: Selector<[TEntity, Commit[]?], TRedis>;
        postSelector?: Selector<TRedis, TOutput>;
      }
    ) => AddRepository;
    addRemoteRepository: <TParent, TEntity, TRedis, TOutput, TEvent>(
      parent: EntityType<TParent>,
      entity: EntityType<TEntity>,
      option: {
        reducer: ReducerCallback<TParent, TEvent>;
        fields: RedisearchDefinition<TParent>;
        preSelector?: Selector<[TParent, Commit[]?], TRedis>;
        postSelector?: Selector<TRedis, TOutput>;
      }
    ) => AddRemoteRepository;
    // addRedisRepository: <TInput, TItemInRedis, TOutput>(
    //   entity: EntityType<TInput>,
    //   option: {
    //     fields: RedisearchDefinition<TInput>;
    //     preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    //     postSelector?: Selector<TItemInRedis, TOutput>;
    // }) => AddRedisRepository;
  };
  disconnect: () => void;
  getMspId: () => string;
  getRedisRepos: () => Record<string, RedisRepository>;
  getRepository: <TEntity, TOutput, TEvent>(
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>
  ) => Repository<TEntity, TOutput, TEvent>;
  getPrivateRepository: <TEntity, TEvent>(
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>
  ) => PrivateRepository<TEntity, TEvent>;
  getServiceName: () => string;
  shutdown: (server: ApolloServer) => Promise<void>;
};
