import type { PrivateRepository, Reducer, Repository } from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Commit, RedisearchDefinition } from '@fabric-es/fabric-cqrs';
import { Selector } from 'reselect';

interface AddRepository {
  create: (option?: {
    mspId?: string;
    playground?: boolean;
    introspection?: boolean;
  }) => Promise<ApolloServer>;
  addRepository: (repository: Repository | PrivateRepository) => this;
}

export type FederatedService = {
  addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
    entityName: string;
    fields: RedisearchDefinition<TInput>;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
  }) => void;
  config: (option: {
    typeDefs: any;
    resolvers: any;
  }) => {
    addRepository: (repository: Repository | PrivateRepository) => AddRepository;
  };
  disconnect: () => void;
  mspId: string;
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
