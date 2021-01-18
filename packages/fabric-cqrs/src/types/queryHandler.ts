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
 * - see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
 * - see example [subscribe.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/subscribe.unit-test.ts)
 * ```typescript
 * // search by wildcard
 * ['test*']
 * // search by event TAG
 * ['@event:{increment}']
 * // search by msp TAG
 * ['@msp:{org1msp}']
 * ```
 */
export interface PaginatedCommitCriteria {
  /** events array **/
  events?: string[];

  startTime?: number;

  endTime?: number;

  creator?: string;

  /** cursor-based pagination, default 0 **/
  cursor: number;

  /** page size, default 10 **/
  pagesize: number;

  /** indexes by RediSearch **/
  sortByField?: 'id' | 'key' | 'entityName' | 'ts' | 'creator';

  /** sortBy either ASC or DESC **/
  sort?: 'ASC' | 'DESC';
}

/**
 * input criteria for RedisSearch, return paginated entity
 * - see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
 * - see example [subscribe.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/subscribe.unit-test.ts)
 * ```typescript
 * // search by wildcard
 * ['test*']
 * // search by organization TAG
 * ['@org:{org1msp}']
 * ```
 */
export interface PaginatedEntityCriteria {
  /** aka mspId **/
  organization?: string;

  /** either LAST_MODIFIEd or CREATED **/
  scope?: 'LAST_MODIFIED' | 'CREATED';

  startTime?: number;

  endTime?: number;

  creator?: string;

  /** cursor-based pagination, default 0 **/
  cursor: number;

  /** page size, default 10 **/
  pagesize: number;

  /** indexes by RediSearch **/
  sortByField?: 'id' | 'key' | 'created' | 'creator' | 'ts';

  /** sortBy either ASC or DESC **/
  sort?: 'ASC' | 'DESC';
}

/**
 * ### QueryHandler
 * QueryHandler provides utility to access query database
 */
export interface QueryHandler {
  /**
   * 📥 write events to onchain repository, with enrollmentId, and entityId
   *
   * 🔬 this api is solely for *unit-test* purpose.
   *
   * 🧬 same as [[Repository.create]]
   * **/
  create: <TEvent>(
    entityName: string
  ) => (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /**
   * update current entity, by appending new events
   * 1. 📤  get currentState of entity by entityId
   * 1. 📥  return [[SaveFcn | Save]] function to append new events
   *
   * 🧬 same as [[Repository.getById]]
   * **/
  getById: <TEntity, TEvent>(
    entityName: string
  ) => (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;

  /**
   * 📤  get commits by entityName. Reduce to _entity_, on the fly
   * @return ```typescript
   * () => Promise<HandlerResponse<TEntity[]>>
   * ```
   **/
  getByEntityName: <TEntity = any>(entityName: string) => RepoFcn<TEntity[]>;

  /**
   * 📤 get commits by entityId
   *
   * 🧬 same as [[Repository.getCommitById]]
   * @return ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitById: (entityName: string) => RepoFcn_Id<Commit[]>;

  /**
   * 📥 delete commit by entityId
   *
   * 🔬 this api is solely for *unit-test* purpose.
   *
   * 🧬 same as [[Repository.command_deleteByEntityId]]
   * @return ```typescript
   * (payload: { id: string }) =>
   *   Promise<HandlerResponse<<FabricResponse>>>
   * ```
   * **/
  command_deleteByEntityId: (entityName: string) => RepoFcn_Id<FabricResponse>;

  /* command-side: get commit by entityName
   * It is private api, only used for development and unit test of QueryHandler */
  /**
   * 📥 get commits by entityName
   *
   * 🔬 this api is solely for *unit-test* purpose.
   *
   * 🧬 same as [[Repository.command_getByEntityName]]
   * @return ```typescript
   * () => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  command_getByEntityName: (entityName: string) => RepoFcn<Commit[]>;

  /**
   * 📤 delete commmts by entityId
   *
   * 🧬 same as [[Repository.query_deleteCommitByEntityId]]
   * @return ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityId: (entityName: string) => RepoFcn_Id<number>;

  /**
   * 📤 delete commit by entityName
   *
   * 🧬 same as [[Repository.query_deleteCommitByEntityName]]
   * @return ```typescript
   * () => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityName: (entityName: string) => RepoFcn<number>;

  /**
   * 📤 get paginated entity by entityId. This is specialized version of
   * [[QueryHandler.fullTextSearchEntity]], with parametric query.
   *
   * 🧬 same as [[Repository.getPaginatedEntityById]]
   *
   * 🧬 similar as [[QueryHandler.fullTextSearchEntity]]
   * @return ```typescript
   * (criteria: PaginatedEntityCriteria, id?: string) =>
   *   Promise<HandlerResponse<Paginated<TResult>>>
   * ```
   * **/
  getPaginatedEntityById: <TResult>(
    entiyName: string
  ) => (
    criteria: PaginatedEntityCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<TResult>>>;

  /**
   * 📤 get paginated commit by entityId. This is specialized version of
   * [[QueryHandler.fullTextSearchCommit]], with parametric query.
   *
   * 🧬 same as [[Repository.getPaginatedCommitById]]
   *
   * 🧬 similar as [[QueryHandler.fullTextSearchCommit]]
   * @return ```typescript
   * (criteria: PaginatedCommitCriteria, id?: string) =>
   *   Promise<HandlerResponse<Paginated<Commit>>>
   * ```
   * **/
  getPaginatedCommitById: (
    entiyName: string
  ) => (
    criteria: PaginatedCommitCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<Commit>>>;

  /**
   * full text search of commit.
   *
   * 🧬 similar as [[QueryHandler.getPaginatedCommitById]]
   */
  fullTextSearchCommit: (
    query: string[],
    cursor: number,
    pagesize: number
  ) => Promise<HandlerResponse<Paginated<Commit>>>;

  /**
   * full text search of entity
   *
   * 🧬 similar as [[QueryHandler.getPaginatedEntityById]]
   */
  fullTextSearchEntity: (
    query: string[],
    cursor: number,
    pagesize: number
  ) => Promise<HandlerResponse<Paginated<QueryHandlerEntity>>>;

  /**
   * Primarily used by web ui, to summary info of entities
   */
  queryGetEntityInfo: (payload: { entityName: string }) => Promise<HandlerResponse<EntityInfo>>;

  /**
   * Primarily used by web ui, to retrieve the list of active notifications.
   */
  queryNotify: (payload: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
    expireNow?: boolean;
  }) => Promise<HandlerResponse<Record<string, string>[]>>;

  /**
   * used by bootstraping programs to reconcile entity from Fabric to Redis
   * @return
   * ```typescript
   * (payload: { entityName: string }) =>
   *   Promise<HandlerResponse<{ key: string; status: string }[]>>
   * ```
   * **/
  reconcile: () => (payload: {
    entityName: string;
  }) => Promise<HandlerResponse<{ key: string; status: string }[]>>;

  /**
   * subscribe to Fabric channel event hub
   * @return `() => void`
   * **/
  subscribeHub: (entityNames: string[]) => Promise<any>;

  /**
   * unsubscribe to Fabric channel event hub
   * @return `() => void`
   * **/
  unsubscribeHub: () => void;

  /**
   * disconnect from fabric peer
   * @return `() => void`
   * **/
  disconnect: () => void;
}

/**
 * EntityInfo is the summary info of entity
 */
export interface EntityInfo {
  entityName?: string;

  /** total number of entity **/
  total: number;

  /** type of events  **/
  events: string[];

  /** tags used **/
  tagged: string[];

  /** creators involved **/
  creators: string[];

  /** organization involved **/
  orgs: string[];

  /** total number of commits **/
  totalCommit: number;
}
