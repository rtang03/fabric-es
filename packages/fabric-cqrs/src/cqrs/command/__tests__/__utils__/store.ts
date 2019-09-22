import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { Context } from '../../../../types';
import { epic } from '../../epic';
import { reducer as write } from '../../reducer';

const rootEpic = combineEpics(...epic);

const rootReducer = combineReducers({ write });

export const getStore: (context: Context) => Store = context => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: context
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
