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
  /* path to connectionProfile */
  connectionProfile: string;
  /* queryDatabase instance */
  queryDatabase: QueryDatabase;
  channelName: string;
  /* wallet instance */
  wallet: Wallet;
  /* high level fabric api - network */
  network: Network;
  /* high level fabric api - gateway */
  gateway: Gateway;
  /* winston logger */
  logger?: Logger;
}

/**
 * Private Repository Options
 */
export interface PrivateRepoOption {
  connectionProfile: string;
  channelName: string;
  wallet: Wallet;
  network: Network;
  gateway: Gateway;
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
 * **Repository**
 * Notice that: prefix *command_* is comand-side; and *query_* is query-side operation
 */
export interface Repository<TEntity = any, TEvent = any> {
  /* write events to repository */
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /* command-side: delete commit by entityId */
  command_deleteByEntityId: RepoFcn_Id<FabricResponse>;

  /* command-side:  return commits by entityName */
  command_getByEntityName: RepoFcn<Commit[]>;

  /* command-side: return commits by entityName and commitId */
  command_getByEntityIdCommitId?: RepoFcn_IdCommitId<Commit[]>;

  /* (1) get currentstate by EntityId; (2) return save function to append new events */
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;

  /* query-side:  (1) get commits by EntityName; (2) and then reduce to Entity, on the fly
   * There is no meta data, like _commit, _event
   */
  getByEntityName: () => Promise<HandlerResponse<TEntity[]>>;

  /* query-side: return commits by entityId */
  getCommitById: RepoFcn_Id<Commit[]>;

  /* query-side: delete commmts by entityId */
  query_deleteCommitByEntityId: RepoFcn_Id<number>;

  /* query-side: delete commit by entityName */
  query_deleteCommitByEntityName: RepoFcn<number>;

  /* (To be deprecated) */
  find: (criteria: {
    byId?: string;
    byDesc?: string;
    where?: any;
  }) => Promise<HandlerResponse<TEntity[]>>;

  /* query-side: get commits by EntityName */
  getEntityName: () => string;

  /* disconnect from fabric peer */
  disconnect: () => void;

  /* query-side: return paginated entity by entityId  */
  getPaginatedEntityById: (
    criteria: PaginatedEntityCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<TEntity>>>;

  /* query-side: return paginated commit by entityId */
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
  /* write events to repository */
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };

  /* get commits by entityName */
  getCommitByEntityName: RepoFcn<Commit[]>;

  /* get commits by entityId and commitId */
  getCommitByEntityIdCommitId: RepoFcn_IdCommitId<Commit[]>;

  /* delete commits by entityId and commitId */
  deleteByEntityIdCommitId: RepoFcn_IdCommitId<FabricResponse>;

  /* (1) get currentstate by EntityId; (2) return save function to append new events */
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;

  /* return entityName */
  getEntityName: () => string;

  /* disconnect from fabric peer */
  disconnect: () => void;
}
