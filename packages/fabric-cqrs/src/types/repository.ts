import { Gateway, Network, Wallet } from 'fabric-network';
import type { FTSearchParameters } from 'redis-modules-sdk';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../queryHandler/types';
import type {
  Commit,
  FabricResponse,
  HandlerResponse,
  Paginated,
} from '.';

/**
 * @about repository options
 */
export type RepoOption = {
  channelName: string;

  /** path to connectionProfile **/
  connectionProfile: string;

  /** winston logger **/
  logger?: Logger;

  /** see [fabric-network.Gateway](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Gateway.html) **/
  gateway: Gateway;

  /** queryDatabase instance */
  queryDatabase: QueryDatabase;

  /** see [fabric-network.Network](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Network.html) **/
  network: Network;

  /** see [fabric-network.Wallet](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Wallet.html) **/
  wallet: Wallet;
};

/**
 * @about private Repository Options
 */
export type PrivateRepoOption = {
  channelName: string;

  /** path to connectionProfile **/
  connectionProfile: string;

  /** see [fabric-network.Gateway](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Gateway.html) **/
  gateway: Gateway;

  /** winston logger **/
  logger?: Logger;

  /** see [fabric-network.Network](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Network.html) **/
  network: Network;

  /** see [fabric-network.Wallet](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Wallet.html) **/
  wallet: Wallet;
};

export type SaveFcn<TEvent> = (payload: { events: TEvent[] }) => Promise<HandlerResponse<Commit>>;

export type RepoFcn<TResponse> = () => Promise<HandlerResponse<TResponse>>;

export type RepoFcn_Id<TResponse> = (payload: {
  id: string;
}) => Promise<HandlerResponse<TResponse>>;

export type RepoFcn_IdCommitId<TResponse> = (payload: {
  id: string;
  commitId: string;
}) => Promise<HandlerResponse<TResponse>>;

/**
 * @about repository
 * @command-side.📥 prefix *command_* is write-to-Fabric operations
 * @query-side.📤 prefix *query_* is query-from-Redis operation
 */
export type Repository<TEntity = any, TEvent = any> = {
  /**
   * @about 📥 delete commit by entityId
   * @same [[QueryHandler]].command_deleteByEntityId
   * @return
   * ```typescript
   * (payload: { id: string }) =>
   *   Promise<HandlerResponse<<FabricResponse>>>
   * ```
   * **/
  command_deleteByEntityId: RepoFcn_Id<FabricResponse>;

  /**
   * @about 📥 get commits by entityName
   * @same [[QueryHandler]].command_getByEntityName
   * @return
   * ```typescript
   * () => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  command_getByEntityName: RepoFcn<Commit[]>;

  /**
   * @about 📥 get commits by entityName and commitId
   * @return
   * ```typescript
   * (payload: { commitId: string; id: string }) =>
   *   Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  command_getByEntityIdCommitId?: RepoFcn_IdCommitId<Commit[]>;

  /**
   * @about 📥 write events to repository, with enrollmentId, and entityId
   * @same [[QueryHandler]].create
   * @example
   * ```typescript
   * const response: HandlerResponse<Commit> = await repository
   *   .create({ enrollmentId, id })
   *   .save({ events });
   * ```
   * @return
   * ```typescript
   * {
   *   save: (payload: { events: TEvent[] }) =>
   *     Promise<HandlerResponse<Commit>>
   * }
   * ```
   * **/
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /** @about disconnect from fabric peer
   * @return `() => void`
   * **/
  disconnect: () => void;

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
   * @about 📤 get commits by entityName. Reduce to _entity_, on the fly. There is no meta data, like _commit, _event
   * @return
   * ```typescript
   * () => Promise<HandlerResponse<TEntity[]>>
   * ```
   **/
  getByEntityName: () => Promise<HandlerResponse<TEntity[]>>;

  /**
   * @about update current entity, by appending new events
   * 1. 📤  get currentState of entity by entityId
   * 1. 📥  return [[SaveFcn | Save]] function to append new events
   * @same [[QueryHandler]].getById
   * @example
   * ```typescript
   * const { save, currentState } = await repository.getById({ enrollmentId, id });
   * console.log(currentState);
   * const { data, status } = await save({
   *     events: [
   *       {
   *         type: 'Any-Event',
   *         payload: { id, desc: 'hello', tag: 'any-tag' },
   *       },
   *     ],
   *   })
   * ```
   * @return
   * ```typescript
   * {
   *   currentState: TEntity;
   *   save: (payload: { events: TEvent[] }) =>
   *           Promise<HandlerResponse<Commit>>
   * }
   * ```
   * **/
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;

  /**
   * @about 📤 get EntityName
   * @return `() => string`
   * **/
  getEntityName: () => string;

  /**
   * @about 📤 get commits by entityId
   * @same [[QueryHandler]].getCommitById
   * @return
   * ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitById: RepoFcn_Id<Commit[]>;

  /**
   * @about 📤 delete commmts by entityId
   * @same [[QueryHandler]].query_deleteCommitByEntityId
   * @return
   * ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityId: RepoFcn_Id<number>;

  /**
   * @about 📤 delete commit by entityName
   * @same [[QueryHandler]].query_deleteCommitByEntityId
   * @return
   * ```typescript
   * () => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityName: RepoFcn<number>;

  /**
   * @about 📤 get paginated entity by entityId
   * @same [[QueryHandler]].getPaginatedEntityById
   * @return
   * ```typescript
   * (criteria: PaginatedEntityCriteria, id?: string) =>
   *   Promise<HandlerResponse<Paginated<TEntity>>>
   * ```
   * **/
  // getPaginatedEntityById: (
  //   criteria: PaginatedEntityCriteria,
  //   id?: string
  // ) => Promise<HandlerResponse<Paginated<TEntity>>>;

  /**
   * @about 📤 get paginated commit by entityId
   * @same [[QueryHandler]].getPaginatedCommitById
   * @return
   * ```typescript
   * (criteria: PaginatedCommitCriteria, id?: string) =>
   *   Promise<HandlerResponse<Paginated<Commit>>>
   * ```
   * **/
  // getPaginatedCommitById: (
  //   criteria: PaginatedCommitCriteria,
  //   id?: string
  // ) => Promise<HandlerResponse<Paginated<Commit>>>;
};

/**
 * @about repository for private data
 * Noitce that both read and write are made directly to Fabric. No Redis involved.
 */
export type PrivateRepository<TEntity = any, TEvent = any> = {
  /**
   * @about 📥 write events to private repository, with enrollmentId, and entityId
   * @similar [[Repository]].create
   * @example
   * ```typescript
   * const response: HandlerResponse<Commit> = await repository
   *   .create({ enrollmentId, id })
   *   .save({ events });
   * ```
   * @return
   * ```typescript
   * {
   *   save: (payload: { events: TEvent[] }) =>
   *     Promise<HandlerResponse<Commit>>
   * }
   * ```
   * **/
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /**
   * @about 📥 delete commits by entityId and commitId
   * @return
   * ```typescript
   * (payload: { commitId: string; id: string }) =>
   *   Promise<HandlerResponse<FabricResponse>>
   * ```
   * **/
  deleteByEntityIdCommitId: RepoFcn_IdCommitId<FabricResponse>;

  /**
   * @about disconnect from fabric peer
   * @return `() => void`
   * **/
  disconnect: () => void;

  /**
   * @about update current entity, by appending new events
   * 1. 📥 get currentState of entity by entityId
   * 1. 📥 return [[SaveFcn | Save]] function to append new events
   * @similar [[Repository]].getById
   * @example
   * ```typescript
   * const { save, currentState } = await repository.getById({ enrollmentId, id });
   * console.log(currentState);
   * const { data, status } = await save({
   *     events: [
   *       {
   *         type: 'Any-Event',
   *         payload: { id, desc: 'hello', tag: 'any-tag' },
   *       },
   *     ],
   *   })
   * ```
   * @return
   * ```typescript
   * {
   *   currentState: TEntity;
   *   save: (payload: { events: TEvent[] }) =>
   *           Promise<HandlerResponse<Commit>>
   * }
   * ```
   * **/
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;

  /**
   * @about 📥 get commits by entityName
   * @similar [[Repository]].getCommitByEntityName
   * @return
   * ```typescript
   * () => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitByEntityName: RepoFcn<Commit[]>;

  /**
   * @about 📥 get commits by entityName and commitId
   * @similar [[Repository]].getCommitByEntityIdCommitId
   * @return
   * ```typescript
   * (payload: { commitId: string; id: string }) =>
   *   Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitByEntityIdCommitId: RepoFcn_IdCommitId<Commit[]>;

  /**
   * @about 📥 get entityName
   * @similar [[Repository]].getEntityName
   * @return `() => string`
   * **/
  getEntityName: () => string;
};
