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
  Paginated, QueryHandlerEntity
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
export interface PaginatedCommitCriteria {
  events?: string[];
  startTime?: number;
  endTime?: number;
  creator?: string;
  cursor: number;
  pagesize: number;
  sortByField?: 'id' | 'key' | 'entityName' | 'ts' | 'creator';
  sort?: 'ASC' | 'DESC';
}

export interface PaginatedEntityCriteria {
  organization?: string;
  scope?: 'LAST_MODIFIED' | 'CREATED';
  startTime?: number;
  endTime?: number;
  creator?: string;
  cursor: number;
  pagesize: number;
  sortByField?: 'id' | 'key' | 'created' | 'creator' | 'ts';
  sort?: 'ASC' | 'DESC';
}
export interface QueryHandler {
  // command-side: create commit
  create: <TEvent>(
    entityName: string
  ) => (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  // (1) command-side:  save new events; (2) query-side: get entity by EntityId
  getById: <TEntity, TEvent>(
    entityName: string
  ) => (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;

  // query-side: (1) get commits by EntityName; (2) and then reduce to Entity, on the fly
  // Note: There is no meta data, like _commit, _event
  getByEntityName: <TEntity = any>(entityName: string) => RepoFcn<TEntity[]>;

  // query-side: query commits by EntityId
  getCommitById: (entityName: string) => RepoFcn_Id<Commit[]>;

  // command-side: delete commit by EntityId
  command_deleteByEntityId: (entityName: string) => RepoFcn_Id<FabricResponse>;

  // command-side: get commits by EntityName
  command_getByEntityName: (entityName: string) => RepoFcn<Commit[]>;

  // query-side: delete commit by EntityId
  query_deleteCommitByEntityId: (entityName: string) => RepoFcn_Id<number>;

  // query-side: delete commt by EntityName
  query_deleteCommitByEntityName: (entityName: string) => RepoFcn<number>;

  getPaginatedEntityById: <TResult>(
    entiyName: string
  ) => (
    criteria: PaginatedEntityCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<TResult>>>;

  getPaginatedCommitById: (
    entiyName: string
  ) => (
    criteria: PaginatedCommitCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<Commit>>>;

  fullTextSearchCommit: (
    query: string[],
    cursor: number,
    pagesize: number
  ) => Promise<HandlerResponse<Paginated<Commit>>>;

  fullTextSearchEntity: (
    query: string[],
    cursor: number,
    pagesize: number
  ) => Promise<HandlerResponse<Paginated<QueryHandlerEntity>>>;

  /**
   * Used by bootstraping programs
   */
  reconcile: () => (payload: {
    entityName: string;
  }) => Promise<HandlerResponse<{ key: string; status: string }[]>>;
  subscribeHub: (entityNames: string[]) => Promise<any>;
  unsubscribeHub: () => void;
  disconnect: () => void;
}
