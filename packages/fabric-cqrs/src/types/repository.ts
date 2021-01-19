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

  /** see [fabric-network.Wallet](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Wallet.html) **/
  wallet: Wallet;

  /** see [fabric-network.Network](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Network.html) **/
  network: Network;

  /** see [fabric-network.Gateway](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Gateway.html) **/
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

  /** see [fabric-network.Wallet](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Wallet.html) **/
  wallet: Wallet;

  /** see [fabric-network.Network](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Network.html) **/
  network: Network;

  /** see [fabric-network.Gateway](https://hyperledger.github.io/fabric-sdk-node/release-2.2/module-fabric-network.Gateway.html) **/
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
   *
   * 🧬 same as [[QueryHandler.create]]
   * ```typescript
   * // example
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
   * 📥 delete commit by entityId
   *
   * 🧬 same as [[QueryHandler.command_deleteByEntityId]]
   * @return
   * ```typescript
   * (payload: { id: string }) =>
   *   Promise<HandlerResponse<<FabricResponse>>>
   * ```
   * **/
  command_deleteByEntityId: RepoFcn_Id<FabricResponse>;

  /**
   * 📥 get commits by entityName
   *
   * 🧬 same as [[QueryHandler.command_getByEntityName]]
   * @return
   * ```typescript
   * () => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  command_getByEntityName: RepoFcn<Commit[]>;

  /**
   * 📥 get commits by entityName and commitId \
   * @return
   * ```typescript
   * (payload: { commitId: string; id: string }) =>
   *   Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  command_getByEntityIdCommitId?: RepoFcn_IdCommitId<Commit[]>;

  /**
   * update current entity, by appending new events
   * 1. 📤  get currentState of entity by entityId
   * 1. 📥  return [[SaveFcn | Save]] function to append new events
   *
   * 🧬 same as [[QueryHandler.getById]]
   * ```typescript
   * // example
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
   * 📤 get commits by entityName. Reduce to _entity_, on the fly. There is no meta data, like _commit, _event
   * @return
   * ```typescript
   * () => Promise<HandlerResponse<TEntity[]>>
   * ```
   **/
  getByEntityName: () => Promise<HandlerResponse<TEntity[]>>;

  /**
   * 📤 get commits by entityId
   *
   * 🧬 same as [[QueryHandler.getCommitById]]
   * @return
   * ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitById: RepoFcn_Id<Commit[]>;

  /**
   * 📤 delete commmts by entityId
   *
   * 🧬 same as [[QueryHandler.query_deleteCommitByEntityId]]
   * @return
   * ```typescript
   * (payload: { id: string }) => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityId: RepoFcn_Id<number>;

  /**
   * 📤 delete commit by entityName
   *
   * 🧬 same as [[QueryHandler.query_deleteCommitByEntityId]]
   * @return
   * ```typescript
   * () => Promise<HandlerResponse<number>>
   * ```
   * **/
  query_deleteCommitByEntityName: RepoFcn<number>;

  /** (To be deprecated, dont use it) **/
  find: (criteria: {
    byId?: string;
    byDesc?: string;
    where?: any;
  }) => Promise<HandlerResponse<TEntity[]>>;

  /**
   * 📤 get EntityName
   * @return `() => string`
   * **/
  getEntityName: () => string;

  /** disconnect from fabric peer
   * @return `() => void`
   * **/
  disconnect: () => void;

  /**
   * 📤 get paginated entity by entityId
   *
   * 🧬 same as [[QueryHandler.getPaginatedEntityById]]
   * @return
   * ```typescript
   * (criteria: PaginatedEntityCriteria, id?: string) =>
   *   Promise<HandlerResponse<Paginated<TEntity>>>
   * ```
   * **/
  getPaginatedEntityById: (
    criteria: PaginatedEntityCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<TEntity>>>;

  /**
   * 📤 get paginated commit by entityId
   *
   * 🧬 same as [[QueryHandler.getPaginatedCommitById]]
   * @return
   * ```typescript
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
 * ### Repository for Private Data
 * 📌 Noitce that both read and write are made directly to Fabric. No Redis involved.
 */
export interface PrivateRepository<TEntity = any, TEvent = any> {
  /**
   * 📥 Write events to private repository, with enrollmentId, and entityId
   *
   * 🧬 similar as [[Repository.create]]
   * ```typescript
   * // example
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
   * 📥 get commits by entityName
   *
   * 🧬 similar as [[Repository.getCommitByEntityName]]
   * @return
   * ```typescript
   * () => Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitByEntityName: RepoFcn<Commit[]>;

  /**
   * 📥 get commits by entityName and commitId
   *
   * 🧬 similar as [[Repository.getCommitByEntityIdCommitId]]
   * @return
   * ```typescript
   * (payload: { commitId: string; id: string }) =>
   *   Promise<HandlerResponse<Commit[]>>
   * ```
   * **/
  getCommitByEntityIdCommitId: RepoFcn_IdCommitId<Commit[]>;

  /**
   * 📥 delete commits by entityId and commitId
   * @return
   * ```typescript
   * (payload: { commitId: string; id: string }) =>
   *   Promise<HandlerResponse<FabricResponse>>
   * ```
   * **/
  deleteByEntityIdCommitId: RepoFcn_IdCommitId<FabricResponse>;

  /**
   * update current entity, by appending new events
   * 1. 📥 get currentState of entity by entityId
   * 1. 📥 return [[SaveFcn | Save]] function to append new events
   *
   * 🧬 similar as [[Repository.getById]]
   * ```typescript
   * // example
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
   * 📥 get EntityName
   *
   * 🧬 similar as [[Repository.getById]]
   * @return `() => string`
   * **/
  getEntityName: () => string;

  /**
   * disconnect from fabric peer
   * @return `() => void`
   * **/
  disconnect: () => void;
}
