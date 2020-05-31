import { BaseEvent, Commit, Reducer } from '@fabric-es/fabric-cqrs';
import { Gateway, Network, Wallet } from 'fabric-network';
import type { Logger } from 'winston';
import type { FabricResponse } from './fabricResponse';
import type { QueryDatabase } from './queryDatabase';

export interface QueryHandlerOptions {
  queryDatabase: QueryDatabase;
  gateway: Gateway;
  network: Network;
  channelName: string;
  wallet: Wallet;
  connectionProfile: string;
  reducers: Record<string, Reducer>;
  logger: Logger;
}

export interface GetByEntityNameResponse<TEntity = any> {
  currentStates: TEntity[];
  errors: string[];
}

export interface QueryHandlerResponse<TData = any> {
  data?: TData;
  message?: string;
  error?: any;
  status?: string;
}

export interface QueryHandler {
  command_create: (option: {
    enrollmentId: string;
    id: string;
    entityName: string;
  }) => {
    save: (payload: {
      events: BaseEvent[];
    }) => Promise<QueryHandlerResponse<Record<string, Commit>>>;
  };
  command_deleteByEntityId: () => (payload: {
    entityName: string;
    id: string;
  }) => Promise<QueryHandlerResponse<FabricResponse>>;
  command_getByEntityName: () => (payload: {
    entityName: string;
  }) => Promise<QueryHandlerResponse<Record<string, Commit>>>;
  query_getById: <TEntity = any>(option: {
    enrollmentId: string;
    id: string;
    entityName: string;
    reducer: Reducer;
  }) => Promise<{
    currentState: TEntity;
    save: (payload: {
      events: BaseEvent[];
    }) => Promise<QueryHandlerResponse<Record<string, Commit>>>;
  }>;
  query_getByEntityName: <TEntity = any>(option: {
    entityName: string;
  }) => (payload: {
    entityName: string;
  }) => Promise<QueryHandlerResponse<GetByEntityNameResponse<TEntity>>>;
  query_getCommitById: () => (payload: {
    id: string;
    entityName: string;
  }) => Promise<QueryHandlerResponse<Commit[]>>;
  query_deleteByEntityId: () => (payload: {
    id: string;
    entityName: string;
  }) => Promise<QueryHandlerResponse>;
  query_deleteByEntityName: () => (payload: {
    entityName: string;
  }) => Promise<QueryHandlerResponse>;
  reconcile: () => (payload: {
    entityName: string;
    reducer: Reducer;
  }) => Promise<QueryHandlerResponse>;
  subscribeHub: () => Promise<any>;
  unsubscribeHub: () => void;
  disconnect: () => void;
  commitFTSearch: (option: { query: string }) => Promise<QueryHandlerResponse>;
}
