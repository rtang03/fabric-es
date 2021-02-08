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
 * @about queryHandler Options
 */
export type QueryHandlerOptions = {
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
};

export type GetByEntityNameResponse<TEntity = any> = {
  currentStates: TEntity[];
  errors: string[];
};

/**
 * @about query handler response
 * @typeParam TData Type of data returned
 */
export type HandlerResponse<TData = any> = {
  data?: TData;
  message?: string;
  error?: any;
  errors?: Error[];
  status: string;
};

/**
 * @about input criteria for RedisSearch, return paginated commit
 * @see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
 * @example [subscribe.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/subscribe.unit-test.ts)
 * ```typescript
 * // search by wildcard
 * ['test*']
 * // search by event TAG
 * ['@event:{increment}']
 * // search by msp TAG
 * ['@msp:{org1msp}']
 * ```
 */
export type PaginatedCommitCriteria = {
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
};

/**
 * @about input criteria for RedisSearch, return paginated entity
 * @see [Search Query Syntax](https://oss.redislabs.com/redisearch/Query_Syntax/)
 * @example [subscribe.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/fabric-cqrs/src/queryHandler/__tests__/subscribe.unit-test.ts)
 * ```typescript
 * // search by wildcard
 * ['test*']
 * // search by organization TAG
 * ['@org:{org1msp}']
 * ```
 */
export type PaginatedEntityCriteria = {
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
};

/**
 * @about queryHandler
 * QueryHandler provides utility to access query database
 */
export type QueryHandler = {
  /**
   * @about 📥 write events to onchain repository, with enrollmentId, and entityId
   * @unit_test this api is solely for *unit-test* purpose.
   * @same [[Repository]].create
   * **/
  create: <TEvent>(
    entityName: string
  ) => (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /**
   * @about update current entity, by appending new events
   * 1. 📤  get currentState of entity by entityId
   * 1. 📥  return [[SaveFcn | Save]] function to append new events
   *
   * @same [[Repository]].getById
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
   * @about 📤  get commits by entityName. Reduce to _entity_, on the fly
   * @return ```typescript
   * () => Promise<HandlerResponse<TEntity[]>>
   * ```
   **/
  getByEntityName: <TEntity = any>(entityName: string) => RepoFcn<TEntity[]>;

  /**
   * @about 📤 get commits by entityId
   * @same [[Repository]].getCommitById
   * @return ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitById: (entityName: string) => RepoFcn_Id<Commit[]>;

  /**
   * @about 📥 delete commit by entityId
   * @unit_test this api is solely for *unit-test* purpose.
   * @same [[Repository]].command_deleteByEntityId
   * @return ```typescript
   * (payload: { id: string }) =>
   *   Promise<HandlerResponse<<FabricResponse>>>
   * ```
   * **/
  command_deleteByEntityId: (entityName: string) => RepoFcn_Id<FabricResponse>;

  /**
   * @about 📥 get commits by entityName
   * @unit_test this api is solely for *unit-test* purpose.
   * @same [[Repository]].command_getByEntityName
   * @return ```typescript
   * () => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  command_getByEntityName: (entityName: string) => RepoFcn<Commit[]>;

  /**
   * @about 📤 delete commmts by entityId
   * @same [[Repository]].query_deleteCommitByEntityId
   * @return ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityId: (entityName: string) => RepoFcn_Id<number>;

  /**
   * @about 📤 delete commit by entityName
   * @same [[Repository]].query_deleteCommitByEntityName
   * @return ```typescript
   * () => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityName: (entityName: string) => RepoFcn<number>;

  /**
   * @about 📤 get paginated entity by entityId. This is specialized version of
   * [QueryHandler.fullTextSearchEntity], with parametric query.
   * @same [[Repository]].getPaginatedEntityById
   * @similar [[QueryHandler]].fullTextSearchEntity
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
   * @about 📤 get paginated commit by entityId. This is specialized version of
   * [QueryHandler.fullTextSearchCommit], with parametric query.
   * @same [[Repository]].getPaginatedCommitById
   * @similar [[QueryHandler]].fullTextSearchCommit
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
   * @about full text search of commit.
   * @similar [[QueryHandler]].getPaginatedCommitById
   */
  fullTextSearchCommit?: (
    query: string[],
    cursor: number,
    pagesize: number
  ) => Promise<HandlerResponse<Paginated<Commit>>>;

  /**
   * @about full text search of entity
   * @similar [[QueryHandler]].getPaginatedEntityById
   */
  fullTextSearchEntity?: (
    query: string[],
    cursor: number,
    pagesize: number
  ) => Promise<HandlerResponse<Paginated<QueryHandlerEntity>>>;

  /**
   * @about primarily used by web ui, to summary info of entities
   */
  queryGetEntityInfo: (payload: { entityName: string }) => Promise<HandlerResponse<EntityInfo>>;

  /**
   * @about primarily used by web ui, to retrieve the list of active notifications.
   */
  queryNotify: (payload: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
    expireNow?: boolean;
  }) => Promise<HandlerResponse<Record<string, string>[]>>;

  /**
   * @about used by bootstraping programs to reconcile entity from Fabric to Redis
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
   * @about subscribe to Fabric channel event hub
   * @return `() => void`
   * **/
  subscribeHub: (entityNames: string[]) => Promise<any>;

  /**
   * @about unsubscribe to Fabric channel event hub
   * @return `() => void`
   * **/
  unsubscribeHub: () => void;

  /**
   * @about disconnect from fabric peer
   * @return `() => void`
   * **/
  disconnect: () => void;
};

/**
 * @about entityInfo is the summary info of entity
 */
export type EntityInfo = {
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
};
