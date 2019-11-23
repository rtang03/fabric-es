import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { PeerOptions } from '../../../../types';
import { epic } from '../../epic';
import { reducer as write } from '../../reducer';

const rootEpic = combineEpics(...epic);

const rootReducer = combineReducers({ write });

export const getStore: (options: Partial<PeerOptions>) => Store = options => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: options
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
