import { Gateway, Network } from 'fabric-network';
import { Commit } from './commit';
import { ProjectionDb } from './projectionDb';
import { QueryDatabase } from './queryDatabase';

export interface Context {
  gateway?: Gateway;
  network?: Network;
  queryDatabase?: QueryDatabase;
  projectionDb?: ProjectionDb;
  onChannelEventArrived?: ({ commit }: { commit: Commit }) => void;
}
