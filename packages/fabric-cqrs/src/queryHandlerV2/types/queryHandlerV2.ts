import { Gateway, Network, Wallet } from 'fabric-network';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import type { FTSearchParameters } from 'redis-modules-sdk';
import { Logger } from 'winston';
import type {
  Reducer,
  SaveFcn,
  Commit,
  EntityInfo,
  FabricResponse,
  Paginated,
  RepoFcn,
  RepoFcn_Id,
  HandlerResponse,
} from '../../types';
import type { QueryDatabaseV2 } from '.';

/**
 * @about queryHandler Options
 */
export type QueryHandlerOption = {
  /** when the query handler starts, it reconciles entities from Fabric to Redis **/
  entityNames: string[];

  /** query database instance **/
  queryDatabase: QueryDatabaseV2;

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

export type QueryHandlerV2 = {
  clearNotification: (option: {
    creator: string;
    entityName: string;
    id: string;
    commitId: string;
  }) => Promise<HandlerResponse<string[]>>;

  clearNotifications: (option: {
    creator: string;
    entityName?: string;
    id?: string;
    commitId?: string;
  }) => Promise<HandlerResponse<string[]>>;

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
   * @about full text search of commit.
   * @similar [[QueryHandler]].getPaginatedCommitById
   */
  fullTextSearchCommit: (option: {
    query: string;
    cursor: number;
    pagesize: number;
    param?: FTSearchParameters;
  }) => Promise<HandlerResponse<Paginated<Commit>>>;

  /**
   * @about full text search of entity
   * @similar [[QueryHandler]].getPaginatedEntityById
   */
  fullTextSearchEntity: <TOutputEntity>(option: {
    entityName: string;
    query: string;
    cursor: number;
    pagesize: number;
    param?: FTSearchParameters;
  }) => Promise<HandlerResponse<Paginated<TOutputEntity>>>;

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
