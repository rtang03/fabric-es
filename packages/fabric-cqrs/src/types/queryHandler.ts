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
  Paginated,
  QueryHandlerEntity,
} from '.';

/**
 * QueryHandler Options
 */
export interface QueryHandlerOptions {
  /** when the query handler starts, it reconciles entities from Fabric to Redis **/
  entityNames: string[];

  /** query database instance **/
  queryDatabase: QueryDatabase;

  /** high level fabric api - gateway **/
  gateway: Gateway;

  /** high level fabric api - network **/
  network: Network;

  channelName: string;

  /** wallet instance **/
  wallet: Wallet;

  /** path to connectionProfile **/
  connectionProfile: string;

  /** multiple reducers **/
  reducers: Record<string, Reducer>;

  /** redisPubSub instance **/
  pubSub?: RedisPubSub;

  /** winston logger **/
  logger?: Logger;
}

export interface GetByEntityNameResponse<TEntity = any> {
  currentStates: TEntity[];
  errors: string[];
}

/**
 * Query handler response
 * @typeParam TData Type of data returned
 */
export interface HandlerResponse<TData = any> {
  data?: TData;
  message?: string;
  error?: any;
  status?: string;
}

/**
 * input criteria for RedisSearch, return paginated commit
 */
export interface PaginatedCommitCriteria {
  events?: string[];
  startTime?: number;
  endTime?: number;
  creator?: string;
  cursor: number;

  /* page size */
  pagesize: number;
  sortByField?: 'id' | 'key' | 'entityName' | 'ts' | 'creator';

  /** sortBy either ASC or DESC **/
  sort?: 'ASC' | 'DESC';
}

/**
 * input criteria for RedisSearch, return paginated entity
 */
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

/**
 * **QueryHandler**
 */
export interface QueryHandler {
  /* command-side: create commit */
  create: <TEvent>(
    entityName: string
  ) => (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /* (1) get currentstate by EntityId; (2) return save function to append new events */
  getById: <TEntity, TEvent>(
    entityName: string
  ) => (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;

  /* query-side:  (1) get commits by EntityName; (2) and then reduce to Entity, on the fly
  * There is no meta data, like _commit, _event
  */
  getByEntityName: <TEntity = any>(entityName: string) => RepoFcn<TEntity[]>;

  /* query-side: return commits by entityId */
  getCommitById: (entityName: string) => RepoFcn_Id<Commit[]>;

  /* command-side: delete commit by entityId
  * It is private api, only used for development and unit test of QueryHandler */
  command_deleteByEntityId: (entityName: string) => RepoFcn_Id<FabricResponse>;

  /* command-side: get commit by entityName
  * It is private api, only used for development and unit test of QueryHandler */
  command_getByEntityName: (entityName: string) => RepoFcn<Commit[]>;

  /* query-side: delete commmts by entityId */
  query_deleteCommitByEntityId: (entityName: string) => RepoFcn_Id<number>;

  /* query-side: delete commit by entityName */
  query_deleteCommitByEntityName: (entityName: string) => RepoFcn<number>;

  /* query-side: return paginated entity by entityId  */
  getPaginatedEntityById: <TResult>(
    entiyName: string
  ) => (
    criteria: PaginatedEntityCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<TResult>>>;

  /* query-side: return paginated commit by entityId */
  getPaginatedCommitById: (
    entiyName: string
  ) => (
    criteria: PaginatedCommitCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<Commit>>>;

  /* full text search of commit */
  fullTextSearchCommit: (
    query: string[],
    cursor: number,
    pagesize: number
  ) => Promise<HandlerResponse<Paginated<Commit>>>;

  /* full text search of entity */
  fullTextSearchEntity: (
    query: string[],
    cursor: number,
    pagesize: number
  ) => Promise<HandlerResponse<Paginated<QueryHandlerEntity>>>;

  /* query-side: return summary info of entity */
  queryGetEntityInfo: (payload: { entityName: string }) => Promise<HandlerResponse<EntityInfo>>;

  /* query-side: return active notification */
  queryNotify: (payload: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
    expireNow?: boolean;
  }) => Promise<HandlerResponse<Record<string, string>[]>>;

  /* used by bootstraping programs to reconcile entity from Fabric to Redis */
  reconcile: () => (payload: {
    entityName: string;
  }) => Promise<HandlerResponse<{ key: string; status: string }[]>>;

  /* subscribe to Fabric channel event hub */
  subscribeHub: (entityNames: string[]) => Promise<any>;

  /* unsubscribe to Fabric channel event hub */
  unsubscribeHub: () => void;

  /* disconnect from fabric peer */
  disconnect: () => void;
}

/**
 * **EntityInfo** is the summary info of entity
 */
export interface EntityInfo {
  entityName?: string;

  /* total number of entity */
  total: number;

  /* type of events  */
  events: string[];

  /* tags used */
  tagged: string[];

  /* creators involved */
  creators: string[];

  /* organization involved */
  orgs: string[];

  /* total number of commits */
  totalCommit: number;
}
