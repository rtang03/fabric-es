import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { commandEpic, reducer as write } from '../cqrs/command';
import { projectionEpic, reducer as projection } from '../cqrs/projection';
import { queryEpic, reducer as query } from '../cqrs/query';
import { reconcileEpic, reducer as reconcile } from '../cqrs/reconcile';
import { Context } from '../types';

const rootEpic = combineEpics(
  ...commandEpic,
  ...projectionEpic,
  ...queryEpic,
  ...reconcileEpic
);

const rootReducer = combineReducers({ write, projection, query, reconcile });

export const getStore: (context: Context) => Store = context => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: context
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
