import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { projectionEpic, reducer as projection } from '../..';
import { Context } from '../../../../types';
import { queryEpic, reducer as query } from '../../../query';

const rootEpic = combineEpics(...projectionEpic, ...queryEpic);

const rootReducer = combineReducers({ projection, query });

export const getStore: (context: Context) => Store = context => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: context
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
