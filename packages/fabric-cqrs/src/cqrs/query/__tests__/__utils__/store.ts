import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { queryEpic, reducer as query } from '../..';
import { PeerOptions } from '../../../../types';

const rootEpic = combineEpics(...queryEpic);

const rootReducer = combineReducers({ query });

export const getStore: (options: Partial<PeerOptions>) => Store = options => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: options
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
