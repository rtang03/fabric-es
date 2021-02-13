// import { Gateway, Network } from 'fabric-network';
// import { applyMiddleware, combineReducers, createStore, Store } from 'redux';
// import { combineEpics, createEpicMiddleware } from 'redux-observable';
// import type { Logger } from 'winston';
// import { queryEpic, reducer as query } from '../..';
// import type { QueryDatabase, Reducer } from '../../../../types';
//
// const rootEpic = combineEpics(...queryEpic);
//
// const rootReducer = combineReducers({ query });
//
// export const getStore: (options: {
//   queryDatabase: QueryDatabase;
//   reducers: Record<string, Reducer>;
//   gateway?: Gateway;
//   network?: Network;
//   logger: Logger;
// }) => Store = ({ queryDatabase, gateway, network, reducers, logger }) => {
//   const epicMiddleware = createEpicMiddleware({
//     dependencies: {
//       queryDatabase,
//       gateway,
//       network,
//       reducers,
//       logger,
//     },
//   });
//   const store = createStore(rootReducer, applyMiddleware(epicMiddleware));
//   epicMiddleware.run(rootEpic as any);
//   return store;
// };
