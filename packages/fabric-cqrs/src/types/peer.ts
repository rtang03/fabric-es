import { ChannelEventHub } from 'fabric-client';
import { Gateway, Network } from 'fabric-network';
import { PrivatedataRepository } from './privatedataRepository';
import { ProjectionDb } from './projectionDb';
import { QueryDatabase } from './queryDatabase';
import { Reducer } from './reducer';
import { Repository } from './repository';

export interface Option {
  reducer?: Reducer;
  queryDatabase?: QueryDatabase;
  projectionDb?: ProjectionDb;
  network?: Network;
  gateway?: Gateway;
  channelHub?: ChannelEventHub;
  collection: string;
  // pubSub?: any;
}

export type IPeer = {
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
};
