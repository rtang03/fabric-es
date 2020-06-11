import { Gateway, Network, Wallet } from 'fabric-network';
import type { Logger } from 'winston';
import type { Commit, FabricResponse, HandlerResponse, Reducer, QueryDatabase } from '.';

export interface RepoOption {
  connectionProfile: string;
  queryDatabase: QueryDatabase;
  channelName: string;
  wallet: Wallet;
  network: Network;
  gateway: Gateway;
  reducers: Record<string, Reducer>;
  logger?: Logger;
}

export interface PrivateRepoOption {
  connectionProfile: string;
  channelName: string;
  wallet: Wallet;
  network: Network;
  gateway: Gateway;
  reducers: Record<string, Reducer>;
  logger?: Logger;
}

export type SaveFcn<TEvent> = (payload: {
  events: TEvent[];
}) => Promise<HandlerResponse<Record<string, Commit>>>;

export type RepoFcn<TResponse> = () => Promise<HandlerResponse<TResponse>>;

export type RepoFcn_Id<TResponse> = (payload: {
  id: string;
}) => Promise<HandlerResponse<TResponse>>;

export type RepoFcn_IdCommitId<TResponse> = (payload: {
  id: string;
  commitId: string;
}) => Promise<HandlerResponse<TResponse>>;

export type RepoFcn_find<TResponse> = (criteria: {
  byId?: string;
  byDesc?: string;
  where?: any;
}) => Promise<HandlerResponse<TResponse>>;

export interface Repository<TEntity = any, TEvent = any> {
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };
  command_deleteByEntityId: RepoFcn_Id<FabricResponse>;
  command_getByEntityName: RepoFcn<Record<string, Commit>>;
  command_getByEntityIdCommitId?: RepoFcn_IdCommitId<Record<string, Commit>>;
  getById: (option: {
    enrollmentId: string;
    id: string;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;
  getByEntityName: RepoFcn<TEntity[]>;
  getCommitById: RepoFcn_Id<Commit[]>;
  query_deleteByEntityId: RepoFcn_Id<number>;
  query_deleteByEntityName: RepoFcn<number>;
  find: RepoFcn_find<Record<string, TEntity>>;
  getEntityName: () => string;
  disconnect: () => void;
}

export interface PrivateRepository<TEntity = any, TEvent = any> {
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };
  getCommitByEntityName: RepoFcn<Record<string, Commit>>;
  getCommitByEntityIdCommitId: RepoFcn_IdCommitId<Record<string, Commit>>;
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
