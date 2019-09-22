import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { reconcileEpic, reducer as reconcile } from '../..';
import { Context } from '../../../../types';
import { commandEpic, reducer as write } from '../../../command';
import { queryEpic, reducer as query } from '../../../query';

const rootEpic = combineEpics(...queryEpic, ...commandEpic, ...reconcileEpic);

const rootReducer = combineReducers({ query, write, reconcile });

export const getStore: (context: Context) => Store = context => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: context
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
