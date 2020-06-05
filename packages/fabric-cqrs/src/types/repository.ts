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
  logger?: Logger;
}

export type SaveFcn<TEvent> = (payload: {
  events: TEvent[];
}) => Promise<HandlerResponse<Record<string, Commit>>>;

export type RepoFcn<TResponse> = () => Promise<HandlerResponse<TResponse>>;

export type RepoFcnId<TResponse> = (payload: { id: string }) => Promise<HandlerResponse<TResponse>>;

export type RepoFcnIdCommitId<TResponse> = (payload: {
  id: string;
  commitId: string;
}) => Promise<HandlerResponse<TResponse>>;

export interface Repository<TEntity = any, TEvent = any> {
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };
  command_deleteByEntityId: RepoFcnId<FabricResponse>;
  command_getByEntityName: RepoFcn<Record<string, Commit>>;
  command_getByEntityIdCommitId: RepoFcnIdCommitId<Record<string, Commit>>;
  query_getById: (option: {
    enrollmentId: string;
    id: string;
    reducer: Reducer;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;
  query_getByEntityName: RepoFcn<TEntity[]>;
  query_getCommitById: RepoFcnId<Commit[]>;
  query_deleteByEntityId: RepoFcnId<any>;
  query_deleteByEntityName: RepoFcn<any>;
  getEntityName: () => string;
  disconnect: () => void;
}

export interface PrivateRepository<TEntity = any, TEvent = any> {
  create: (option: { enrollmentId: string; id: string }) => { save: SaveFcn<TEvent> };
  getByEntityName: RepoFcn<Record<string, Commit>>;
  getByEntityIdCommitId: RepoFcnIdCommitId<Record<string, Commit>>;
  deleteByEntityIdCommitId: RepoFcnIdCommitId<FabricResponse>;
  getById: (option: {
    enrollmentId: string;
    id: string;
    reducer: Reducer;
  }) => Promise<{
    currentState: TEntity;
    save: SaveFcn<TEvent>;
  }>;
  getEntityName: () => string;
  disconnect: () => void;
}
