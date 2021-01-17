import { Gateway, Network, Wallet } from 'fabric-network';
import type { Logger } from 'winston';
import type {
  Commit,
  FabricResponse,
  HandlerResponse,
  Paginated,
  PaginatedCommitCriteria,
  PaginatedEntityCriteria,
  QueryDatabase,
} from '.';

/**
 * Repository Options
 */
export interface RepoOption {
  /** path to connectionProfile **/
  connectionProfile: string;

  /** queryDatabase instance */
  queryDatabase: QueryDatabase;

  channelName: string;

  /** See [fabric-network.Wallet](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Wallet.html) **/
  wallet: Wallet;

  /** See [fabric-network.Network](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Network.html) **/
  network: Network;

  /** See [fabric-network.Gateway](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Gateway.html) **/
  gateway: Gateway;

  /** winston logger **/
  logger?: Logger;
}

/**
 * Private Repository Options
 */
export interface PrivateRepoOption {
  /** path to connectionProfile **/
  connectionProfile: string;

  channelName: string;

  /** See [fabric-network.Wallet](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Wallet.html) **/
  wallet: Wallet;

  /** See [fabric-network.Network](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Network.html) **/
  network: Network;

  /** See [fabric-network.Gateway](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Gateway.html) **/
  gateway: Gateway;

  /** winston logger **/
  logger?: Logger;
}

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
 * ### Repository
 * 📌 prefix *command_* is comand-side 📥 ; and *query_* is query-side 📤 operation
 */
export interface Repository<TEntity = any, TEvent = any> {
  /**
   * 📥 Write events to repository, with enrollmentId, and entityId
   * ```typescript
   * // example
   * const response: HandlerResponse<Commit> = await repository
   *   .create({ enrollmentId, id })
   *   .save({ events });
   * ```
   * @return ```typescript
   * { save: (payload: { events: TEvent[] }) =>
   *           Promise<HandlerResponse<Commit>> }
   * ```
   * **/
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /** 📥  delete commit by entityId
   * @return ```typescript
   * (payload: { id: string }) =>
   *   Promise<HandlerResponse<<FabricResponse>>>
   * ```
   * **/
  command_deleteByEntityId: RepoFcn_Id<FabricResponse>;

  /** 📥  get commits by entityName
   * @return ```typescript
   * () => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  command_getByEntityName: RepoFcn<Commit[]>;

  /** 📥 get commits by entityName and commitId \
   * @return ```typescript
   * (payload: { commitId: string; id: string }) =>
   *   Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  command_getByEntityIdCommitId?: RepoFcn_IdCommitId<Commit[]>;

  /** Update current entity, by appending new events
   * 1. 📤  get currentState of entity by entityId
   * 1. 📥  return [[SaveFcn | Save]] function to append new events
   * @return ```typescript
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

  /** 📤 get commits by entityName
   * - reduce to _entity_, on the fly. There is no meta data, like _commit, _event
   * @return ```typescript
   * () => Promise<HandlerResponse<TEntity[]>>
   * ```
   **/
  getByEntityName: () => Promise<HandlerResponse<TEntity[]>>;

  /** 📤 get commits by entityId
   * @return ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitById: RepoFcn_Id<Commit[]>;

  /** 📤 delete commmts by entityId
   * @return ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityId: RepoFcn_Id<number>;

  /** 📤 delete commit by entityName
   * @return ```typescript
   * () => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityName: RepoFcn<number>;

  /** (To be deprecated) **/
  find: (criteria: {
    byId?: string;
    byDesc?: string;
    where?: any;
  }) => Promise<HandlerResponse<TEntity[]>>;

  /** 📤 get EntityName
   * @return `() => string`
   * **/
  getEntityName: () => string;

  /** disconnect from fabric peer
   * @return `() => void`
   * **/
  disconnect: () => void;

  /** 📤 get paginated entity by entityId
   * @return ```typescript
   * (criteria: PaginatedEntityCriteria, id?: string) =>
   *   Promise<HandlerResponse<Paginated<TEntity>>>
   * ```
   * **/
  getPaginatedEntityById: (
    criteria: PaginatedEntityCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<TEntity>>>;

  /** 📤 get paginated commit by entityId
   * @return ```typescript
   * (criteria: PaginatedCommitCriteria, id?: string) =>
   *   Promise<HandlerResponse<Paginated<Commit>>>
   * ```
   * **/
  getPaginatedCommitById: (
    criteria: PaginatedCommitCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<Commit>>>;
}

/**
 * **Repository for Private Data**
 * Noitce that both read and write are made directly to Fabric
 */
export interface PrivateRepository<TEntity = any, TEvent = any> {
  /** write events to repository
   * @return ```typescript
   * ```
   * **/
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /** get commits by entityName
   * @return ```typescript
   * ```
   * **/
  getCommitByEntityName: RepoFcn<Commit[]>;

  /** get commits by entityId and commitId
   * @return ```typescript
   * ```
   * **/
  getCommitByEntityIdCommitId: RepoFcn_IdCommitId<Commit[]>;

  /** delete commits by entityId and commitId
   * @return ```typescript
   * ```
   * **/
  deleteByEntityIdCommitId: RepoFcn_IdCommitId<FabricResponse>;

  /** (1) get currentstate by EntityId; (2) return save function to append new events
   * @return ```typescript
   * ```
   * **/
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;

  /** return entityName **/
  getEntityName: () => string;

  /** disconnect from fabric peer **/
  disconnect: () => void;
}
