/**
 * @packageDocumentation
 * @hidden
 */
import { Gateway, Network } from 'fabric-network';
import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import type { Logger } from 'winston';
import type { Reducer } from '../types';
import type { QueryDatabase } from '../types';
import { commandEpic, reducer as write } from './command';
import { projectionEpic, reducer as projection } from './projection';
import { queryEpic, reducer as query } from './query';
import { reconcileEpic, reducer as reconcile } from './reconcile';

const rootEpic = combineEpics(...commandEpic, ...projectionEpic, ...queryEpic, ...reconcileEpic);

const rootReducer = combineReducers({ write, projection, query, reconcile });

export const getStore: (options: {
  queryDatabase: QueryDatabase;
  gateway: Gateway;
  network: Network;
  reducers: Record<string, Reducer>;
  logger: Logger;
}) => Store = ({ queryDatabase, gateway, network, reducers, logger }) => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: {
      queryDatabase,
      reducers,
      gateway,
      network,
      logger,
    },
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
