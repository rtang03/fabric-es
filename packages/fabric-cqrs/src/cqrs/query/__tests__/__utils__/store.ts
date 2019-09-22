import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { queryEpic, reducer as query } from '../..';
import { Context } from '../../../../types';

const rootEpic = combineEpics(...queryEpic);

const rootReducer = combineReducers({ query });

export const getStore: (context: Context) => Store = context => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: context
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
