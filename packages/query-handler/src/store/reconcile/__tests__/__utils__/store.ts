import type { Reducer } from '@fabric-es/fabric-cqrs';
import { Gateway, Network } from 'fabric-network';
import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../../../../types';
import { commandEpic, reducer as write } from '../../../command';
import { projectionEpic, reducer as projection } from '../../../projection';
import { queryEpic, reducer as query } from '../../../query';
import { reconcileEpic, reducer as reconcile } from '../../index';

const rootEpic = combineEpics(...projectionEpic, ...queryEpic, ...reconcileEpic, ...commandEpic);

const rootReducer = combineReducers({ projection, query, write, reconcile });

export const getStore: (options: {
  queryDatabase: QueryDatabase;
  reducers: Record<string, Reducer>;
  gateway?: Gateway;
  network?: Network;
  logger: Logger;
}) => Store = ({ queryDatabase, gateway, network, reducers, logger }) => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: {
      queryDatabase,
      gateway,
      network,
      reducers,
      logger,
    },
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
