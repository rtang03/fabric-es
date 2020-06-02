import { Gateway, Network } from 'fabric-network';
import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import type { Logger } from 'winston';
import { epic } from '../../epic';
import { reducer as write } from '../../reducer';

const rootEpic = combineEpics(...epic);

const rootReducer = combineReducers({ write });

export const getStore: (options: {
  gateway?: Gateway;
  network?: Network;
  logger: Logger;
}) => Store = (options) => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: options,
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
