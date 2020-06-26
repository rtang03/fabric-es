import { Gateway, Network, Wallet } from 'fabric-network';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import type { Logger } from 'winston';
import type {
  RepoFcn,
  RepoFcn_Id,
  QueryDatabase,
  SaveFcn,
  Commit,
  FabricResponse,
  Reducer,
} from '.';

export interface QueryHandlerOptions {
  entityNames: string[];
  queryDatabase: QueryDatabase;
  gateway: Gateway;
  network: Network;
  channelName: string;
  wallet: Wallet;
  connectionProfile: string;
  reducers: Record<string, Reducer>;
  pubSub?: RedisPubSub;
  logger?: Logger;
}

export interface GetByEntityNameResponse<TEntity = any> {
  currentStates: TEntity[];
  errors: string[];
}

export interface HandlerResponse<TData = any> {
  data?: TData;
  message?: string;
  error?: any;
  status?: string;
}

export interface QueryHandler {
  create: <TEvent>(
    entityName: string
  ) => (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };
  command_deleteByEntityId: (entityName: string) => RepoFcn_Id<FabricResponse>;
  command_getByEntityName: (entityName: string) => RepoFcn<Record<string, Commit>>;
  getById: <TEntity, TEvent>(
    entityName: string
  ) => (option: {
    enrollmentId: string;
    id: string;
    reducer: Reducer;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;
  getByEntityName: <TEntity = any>(entityName: string) => RepoFcn<TEntity[]>;
  getCommitById: (entityName: string) => RepoFcn_Id<Commit[]>;
  query_deleteByEntityId: (entityName: string) => RepoFcn_Id<number>;
  query_deleteByEntityName: (entityName: string) => RepoFcn<number>;
  fullTextSearchCommit: () => (payload: {
    query: string;
  }) => Promise<HandlerResponse<Record<string, Commit>>>;
  fullTextSearchEntity: <TEntity = any>() => (payload: {
    query: string;
  }) => Promise<HandlerResponse<Record<string, TEntity>>>;
  reconcile: () => (payload: {
    entityName: string;
  }) => Promise<HandlerResponse<{ key: string; status: string }[]>>;
  subscribeHub: (entityNames: string[]) => Promise<any>;
  unsubscribeHub: () => void;
  disconnect: () => void;
}
