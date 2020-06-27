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

export interface RepoOption {
  connectionProfile: string;
  queryDatabase: QueryDatabase;
  channelName: string;
  wallet: Wallet;
  network: Network;
  gateway: Gateway;
  logger?: Logger;
}

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

export interface Repository<TEntity = any, TEvent = any> {
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };
  command_deleteByEntityId: RepoFcn_Id<FabricResponse>;
  command_getByEntityName: RepoFcn<Commit[]>;
  command_getByEntityIdCommitId?: RepoFcn_IdCommitId<Commit[]>;
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;
  getByEntityName: () => Promise<HandlerResponse<TEntity[]>>;
  getCommitById: RepoFcn_Id<Commit[]>;
  query_deleteCommitByEntityId: RepoFcn_Id<number>;
  query_deleteCommitByEntityName: RepoFcn<number>;
  find: (criteria: {
    byId?: string;
    byDesc?: string;
    where?: any;
  }) => Promise<HandlerResponse<TEntity[]>>;
  getEntityName: () => string;
  disconnect: () => void;
  getPaginatedEntityById: (
    criteria: PaginatedEntityCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<TEntity>>>;
  getPaginatedCommitById: (
    criteria: PaginatedCommitCriteria,
    id?: string
  ) => Promise<HandlerResponse<Paginated<Commit>>>;
}

export interface PrivateRepository<TEntity = any, TEvent = any> {
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };
  getCommitByEntityName: RepoFcn<Commit[]>;
  getCommitByEntityIdCommitId: RepoFcn_IdCommitId<Commit[]>;
  deleteByEntityIdCommitId: RepoFcn_IdCommitId<FabricResponse>;
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;
  getEntityName: () => string;
  disconnect: () => void;
}
