import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { reconcileEpic, reducer as reconcile } from '../..';
import { PeerOptions } from '../../../../types';
import { commandEpic, reducer as write } from '../../../../store/command';
import { queryEpic, reducer as query } from '../../../query';

const rootEpic = combineEpics(...queryEpic, ...commandEpic, ...reconcileEpic);

const rootReducer = combineReducers({ query, write, reconcile });

export const getStore: (options: Partial<PeerOptions>) => Store = options => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: options
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
