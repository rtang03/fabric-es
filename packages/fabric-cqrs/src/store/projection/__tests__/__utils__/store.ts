import { Gateway, Network } from 'fabric-network';
import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import type { Logger } from 'winston';
import { projectionEpic, reducer as projection } from '../..';
import type { QueryDatabase, Reducer } from '../../../../types';
import { queryEpic, reducer as query } from '../../../query';

const rootEpic = combineEpics(...projectionEpic, ...queryEpic);

const rootReducer = combineReducers({ projection, query });

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
