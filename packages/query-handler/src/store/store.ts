import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
import { combineEpics, createEpicMiddleware } from 'redux-observable';
import { commandEpic, reducer as write } from './command';
import { projectionEpic, reducer as projection } from './projection';
import { queryEpic, reducer as query } from './query';
import { reconcileEpic, reducer as reconcile } from './reconcile';

const rootEpic = combineEpics(...commandEpic, ...projectionEpic, ...queryEpic, ...reconcileEpic);

const rootReducer = combineReducers({ write, projection, query, reconcile });

export const getStore: (options) => Store = ({ queryDatabase, projectionDb, defaultReducer, gateway, network }) => {
  const epicMiddleware = createEpicMiddleware({
    dependencies: {
      queryDatabase,
      projectionDb,
      reducer: defaultReducer, // todo: need to remove, change to input args
      gateway,
      network
    }
  });
  const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
  epicMiddleware.run(rootEpic);
  return store;
};
