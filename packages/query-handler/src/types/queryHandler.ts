import { Commit, Reducer } from '@fabric-es/fabric-cqrs';
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
  getById: <TEntity = any>(reducer: Reducer) => (args: { entityName: string; id: string }) => Promise<{ data: TEntity }>;
  getByEntityName: <TEntity = any>(reducer: Reducer) => (args: { entityName: string }) => Promise<{ data: TEntity[] }>;
  getCommitById: () => (args: { id: string; entityName: string }) => Promise<{ data: Commit[] }>;
  deleteByEntityName: () => (args: { entityName: string }) => Promise<any>;
  reconcile: () => (args: { entityName: string; reducer: Reducer }) => Promise<any>;
  subscribeHub: () => void;
  unsubscribeHub: () => void;
  disconnect: () => void;
}
