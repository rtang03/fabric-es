import { Gateway, Network, Wallet } from 'fabric-network';
import { Logger } from 'winston';
import { QueryDatabase } from './queryDatabase';
import type { Commit, FabricResponse, HandlerResponse, Reducer } from '.';

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

export interface Repository<TEntity = any, TEvent = any> {
  command_create: (option: {
    enrollmentId: string;
    id: string;
  }) => {
    save: (payload: { events: TEvent[] }) => Promise<HandlerResponse<Record<string, Commit>>>;
  };
  command_deleteByEntityId: (payload: { id: string }) => Promise<HandlerResponse<FabricResponse>>;
  command_getByEntityName: () => Promise<HandlerResponse<Record<string, Commit>>>;
  query_getById: (option: {
    enrollmentId: string;
    id: string;
    reducer: Reducer;
  }) => Promise<{
    currentState: TEntity;
    save: (payload: { events: TEvent[] }) => Promise<HandlerResponse<Record<string, Commit>>>;
  }>;
  query_getByEntityName: () => Promise<HandlerResponse<TEntity[]>>;
  query_getCommitById: (payload: {
    id: string;
  }) => Promise<HandlerResponse<Commit[]>>;
  query_deleteByEntityId: (payload: { id: string }) => Promise<HandlerResponse>;
  query_deleteByEntityName: () => Promise<HandlerResponse>;
  getEntityName: () => string;
  disconnect: () => void;
}
