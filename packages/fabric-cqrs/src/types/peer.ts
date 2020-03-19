import { ChannelEventHub } from 'fabric-client';
import { Gateway, Network, Wallet } from 'fabric-network';
import { Commit } from './commit';
import { NgacRepo } from './ngac';
import { PrivatedataRepository } from './privatedataRepository';
import { ProjectionDb } from './projectionDb';
import { QueryDatabase } from './queryDatabase';
import { Reducer } from './reducer';
import { Repository } from './repository';

/**
 * **PeerOptions** defines characteristics of Peer node
 */
export interface PeerOptions {
  /** each peer has one default entity type, known as default entity */
  defaultEntityName: string;

  /** each peer uses default reducer to compute state for projection database */
  defaultReducer: Reducer;

  /** query database of CQRS */
  queryDatabase?: QueryDatabase;

  /** projection database of CQRS */
  projectionDb?: ProjectionDb;

  /** network instance of fabric-sdk */
  network?: Network;

  /** gateway instance of fabric-sdk */
  gateway?: Gateway;

  /** channel event hub of fabric-sdk */
  channelHub?: ChannelEventHub;

  /** collection name of Fabric private data. Note: this field may change, if later upgrade to Fabric V2 */
  collection: string;

  /**
   * callback function invoked when channel event arrives
   * @example `({ commit }: { commit: Commit }) => console.log(commit)`
   */
  onChannelEventArrived?: (CommitObj: { commit: Commit }) => void;

  /** channel name */
  channelName: string;

  /** wallet instance of fabric-sdk. Note: this field will change, if later upgrade to Fabric V2*/
  wallet: Wallet;

  /** local path to connection profile yaml */
  connectionProfile: string;

  /** uri to connecting channel event hub */
  channelEventHubUri: string;
  // pubSub?: any;
}

/**
 * **Peer** node written in repository pattern
 */
export interface Peer {
  /**
   * return repository instance of private data
   * @typeparam TEntity entity type
   * @typeparam TEvent event type
   * @param getPrivateDataRepoOption `
   *    getPrivateDataRepoOption: {
   *    entityName: string;
   *    reducer: Reducer;
   *  }`
   * @returns `PrivatedataRepository<TEntity, TEvent>`
   */
  getPrivateDataRepo: <TEntity = any, TEvent = any>(getPrivateDataRepoOption: {
    entityName: string;
    reducer: Reducer;
  }) => PrivatedataRepository<TEntity, TEvent>;

  /**
   * return repository instance of public data
   * @typeparam TEntity entity type
   * @typeparam TEvent event type
   * @param getRepositoryOption `
   *    getRepositoryOption: {
   *    entityName: string;
   *    reducer: Reducer;
   *  }`
   * @returns `Repository<TEntity, TEvent>`
   */
  getRepository: <TEntity = any, TEvent = any>(getRepositoryOption: {
    entityName: string;
    reducer: Reducer;
  }) => Repository<TEntity, TEvent>;

  /**
   * reconcile the on-chain commits to query database, use for Peer node bootstraping
   * @param reconcileOption `(reconcileOption: { entityName: string; reducer: Reducer })`
   * @returns `Promise<{ result: any }>`
   */
  reconcile: (reconcileOption: { entityName: string; reducer: Reducer }) => Promise<{ result: any }>;

  /** subscribe to channel event hub, use for Peer node bootstraping */
  subscribeHub: () => void;

  /** unsubscribe to channel event hub, use for tear-down of jest tests */
  unsubscribeHub: () => void;

  /** gateway.disconnect() of fabric-sdk, use for tear-down of jest tests */
  disconnect: () => void;

  /** @ignore */
  getNgacRepo: NgacRepo;
}
