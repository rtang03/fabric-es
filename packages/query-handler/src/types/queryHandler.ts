import { BaseEvent, Commit, Reducer } from '@fabric-es/fabric-cqrs';
import { Gateway, Network, Wallet } from 'fabric-network';
import { ProjectionDatabase } from './projectionDatabase';
import { QueryDatabase } from './queryDatabase';
import { FabricResponse } from './fabricResponse';

export interface QueryHandlerOptions {
  queryDatabase: QueryDatabase;
  projectionDatabase?: ProjectionDatabase;
  gateway: Gateway;
  network: Network;
  channelName: string;
  wallet: Wallet;
  connectionProfile: string;
}

export interface QueryHandler {
  command_create: (option: {
    enrollmentId: string;
    id: string;
    entityName: string;
  }) => { save: (payload: { events: BaseEvent[] }) => Promise<{ data: Record<string, Commit> }> };
  command_deleteByEntityId: () => (payload: { entityName: string; id: string }) => Promise<{ data: FabricResponse }>;
  command_queryByEntityName: () => (payload: { entityName: string }) => Promise<{ data: Record<string, Commit> }>;
  query_getById: <TEntity = any>(
    enrollmentId: string,
    id: string,
    entityName: string,
    reducer: Reducer
  ) => Promise<{
    currentState: TEntity;
    save: (args: { events: BaseEvent[] }) => Promise<{ data: Record<string, Commit> }>;
  }>;
  query_getByEntityName: <TEntity = any>(
    reducer: Reducer
  ) => (args: { entityName: string }) => Promise<{ data: TEntity[] }>;
  query_getCommitById: () => (args: { id: string; entityName: string }) => Promise<{ data: Commit[] }>;
  query_deleteByEntityName: () => (args: { entityName: string }) => Promise<any>;
  reconcile: () => (payload: { entityName: string; reducer: Reducer }) => Promise<any>;
  subscribeHub: () => void;
  unsubscribeHub: () => void;
  disconnect: () => void;
}
