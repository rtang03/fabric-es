import { ChannelEventHub } from 'fabric-client';
import { Gateway, Network, Wallet } from 'fabric-network';
import { Commit } from './commit';
import { NgacRepo } from './ngac';
import { PrivatedataRepository } from './privatedataRepository';
import { ProjectionDb } from './projectionDb';
import { QueryDatabase } from './queryDatabase';
import { Reducer } from './reducer';
import { Repository } from './repository';

export interface PeerOptions {
  defaultEntityName: string;
  defaultReducer: Reducer;
  queryDatabase?: QueryDatabase;
  projectionDb?: ProjectionDb;
  network?: Network;
  gateway?: Gateway;
  channelHub?: ChannelEventHub;
  collection: string;
  onChannelEventArrived?: ({ commit }: { commit: Commit }) => void;
  channelName: string;
  wallet: Wallet;
  connectionProfile: string;
  channelEventHubUri: string;
  // pubSub?: any;
}

export interface Peer {
  getPrivateDataRepo: <TEntity = any, TEvent = any>({
    entityName: string,
    reducer: Reducer
  }) => PrivatedataRepository<TEntity, TEvent>;
  getRepository: <TEntity = any, TEvent = any>({
    entityName: string,
    reducer: Reducer
  }) => Repository<TEntity, TEvent>;
  reconcile: ({
    entityName,
    reducer
  }: {
    entityName: string;
    reducer: Reducer;
  }) => Promise<{ result: any }>;
  subscribeHub: () => void;
  unsubscribeHub: () => void;
  disconnect: () => void;
  getNgacRepo: NgacRepo;
}
