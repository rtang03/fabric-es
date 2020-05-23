import { BaseEvent, Commit, Reducer } from '@fabric-es/fabric-cqrs';
import { Gateway, Wallet } from 'fabric-network';
import { ProjectionDatabase } from './projectionDatabase';
import { QueryDatabase } from './queryDatabase';

export interface QueryHandlerOptions {
  queryDatabase: QueryDatabase;
  projectionDatabase?: ProjectionDatabase;
  gateway: Gateway;
  channelName: string;
  wallet: Wallet;
  connectionProfile: string;
}

export interface QueryHandler {
  create: (option: {
    enrollmentId: string;
    id: string;
    entityName: string;
  }) => { save: (args: { events: BaseEvent[] }) => Promise<{ data: Record<string, Commit> }> };
  getById: <TEntity = any>(
    enrollmentId: string,
    id: string,
    entityName: string,
    reducer: Reducer
  ) => Promise<{
    currentState: TEntity;
    save: (args: { events: BaseEvent[] }) => Promise<{ data: Record<string, Commit> }>;
  }>;
  getByEntityName: <TEntity = any>(reducer: Reducer) => (args: { entityName: string }) => Promise<{ data: TEntity[] }>;
  getCommitById: () => (args: { id: string; entityName: string }) => Promise<{ data: Commit[] }>;
  deleteByEntityName: () => (args: { entityName: string }) => Promise<any>;
  reconcile: () => (args: { entityName: string; reducer: Reducer }) => Promise<any>;
  subscribeHub: () => void;
  unsubscribeHub: () => void;
  disconnect: () => void;
}
