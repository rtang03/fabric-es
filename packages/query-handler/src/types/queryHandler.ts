import { BaseEvent, Commit, Reducer } from '@fabric-es/fabric-cqrs';
import { Gateway, Network, Wallet } from 'fabric-network';
import { FabricResponse } from './fabricResponse';
import { ProjectionDatabase } from './projectionDatabase';
import { QueryDatabase } from './queryDatabase';
import { QueryDatabaseResponse } from './queryDatabaseResponse';

export interface QueryHandlerOptions {
  queryDatabase: QueryDatabase;
  projectionDatabase?: ProjectionDatabase;
  gateway: Gateway;
  network: Network;
  channelName: string;
  wallet: Wallet;
  connectionProfile: string;
}
export interface GetByEntityNameResponse<TEntity = any> {
  currentStates: TEntity[];
  errors: string[];
}

export interface QueryHandler {
  command_create: (option: {
    enrollmentId: string;
    id: string;
    entityName: string;
  }) => {
    save: (payload: { events: BaseEvent[] }) => Promise<{ data: Record<string, Commit> }>;
  };
  command_deleteByEntityId: () => (payload: { entityName: string; id: string }) => Promise<{ data: FabricResponse }>;
  command_getByEntityName: () => (payload: { entityName: string }) => Promise<{ data: Record<string, Commit> }>;
  query_getById: <TEntity = any>(option: {
    enrollmentId: string;
    id: string;
    entityName: string;
    reducer: Reducer;
  }) => Promise<{
    currentState: TEntity;
    save: (payload: { events: BaseEvent[] }) => Promise<{ data: Record<string, Commit> }>;
  }>;
  query_getByEntityName: <TEntity = any>(option: {
    reducer: Reducer;
  }) => (payload: { entityName: string }) => Promise<{ data: GetByEntityNameResponse<TEntity> }>;
  query_getCommitById: () => (payload: { id: string; entityName: string }) => Promise<{ data: Commit[] }>;
  query_deleteByEntityId: () => (payload: {
    id: string;
    entityName: string;
  }) => Promise<{ data: QueryDatabaseResponse }>;
  query_deleteByEntityName: () => (payload: { entityName: string }) => Promise<{ data: QueryDatabaseResponse }>;
  reconcile: () => (payload: { entityName: string; reducer: Reducer }) => Promise<any>;
  subscribeHub: () => Promise<any>;
  unsubscribeHub: () => void;
  disconnect: () => void;
}
