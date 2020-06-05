import { Gateway, Network, Wallet } from 'fabric-network';
import type { Logger } from 'winston';
import type {
  RepoFcn,
  RepoFcnId,
  QueryDatabase,
  SaveFcn,
  Commit,
  FabricResponse,
  Reducer,
} from '.';

export interface QueryHandlerOptions {
  queryDatabase: QueryDatabase;
  gateway: Gateway;
  network: Network;
  channelName: string;
  wallet: Wallet;
  connectionProfile: string;
  reducers: Record<string, Reducer>;
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
  command_deleteByEntityId: (entityName: string) => RepoFcnId<FabricResponse>;
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
  getCommitById: (entityName: string) => RepoFcnId<Commit[]>;
  query_deleteByEntityId: (entityName: string) => RepoFcnId<number>;
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
  subscribeHub: () => Promise<any>;
  unsubscribeHub: () => void;
  disconnect: () => void;
  // fullTextSearchCIdx: (option: {
  //   query: string;
  // }) => Promise<HandlerResponse<Record<string, Commit>>>;
}
