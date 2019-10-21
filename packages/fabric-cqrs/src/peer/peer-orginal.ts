// import { keys, values } from 'lodash';
// import { Store } from 'redux';
// import { projectionDb, queryDatabase } from '.';
// import { action as writeAction } from '../cqrs/command';
// import { action as projectionAction } from '../cqrs/projection';
// import { action as queryAction } from '../cqrs/query';
// import { action as reconcileAction } from '../cqrs/reconcile';
// import { generateToken } from '../cqrs/utils';
// import { channelEventHub } from '../services';
// import { getStore } from '../store';
// import {
//   Commit,
//   IPeer,
//   Option,
//   PrivatedataRepository,
//   Repository
// } from '../types';
// import {
//   fromCommitsToGroupByEntityId,
//   getHistory,
//   getPromiseToSave
// } from './utils';
//
// export class Peer implements IPeer {
//   store: Store;
//   registerId: any;
//   collection: string;
//
//   constructor(public option: Option) {
//     if (!option.projectionDb) this.option.projectionDb = projectionDb;
//     if (!option.queryDatabase) this.option.queryDatabase = queryDatabase;
//     if (option.collection) this.collection = option.collection;
//     else {
//       console.error('null privatedata collection');
//       throw new Error('Null privatedata collection');
//     }
//     this.store = getStore(option);
//   }
//
//   getPrivateDataRepo<TEntity, TEvent>({
//                                         entityName,
//                                         reducer
//                                       }): PrivatedataRepository<TEntity, TEvent> {
//     return {
//       create: id => ({
//         save: events =>
//           getPromiseToSave({
//             id,
//             entityName,
//             version: 0,
//             events,
//             store: this.store,
//             collection: this.collection
//           })
//       }),
//       getById: id =>
//         new Promise<{
//           currentState: TEntity;
//           save: (events: TEvent[]) => Promise<Commit | { error: any }>;
//         }>((resolve, reject) => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { write } = this.store.getState();
//             const { tx_id, result, error, type } = write;
//             if (tx_id === tid && type === writeAction.QUERY_SUCCESS) {
//               unsubscribe();
//               resolve({
//                 currentState: reducer(getHistory(result)),
//                 save: events =>
//                   getPromiseToSave({
//                     id,
//                     entityName,
//                     events,
//                     version: keys(result).length,
//                     store: this.store,
//                     collection: this.collection
//                   })
//               });
//             }
//             if (tx_id === tid && type === writeAction.QUERY_ERROR) {
//               unsubscribe();
//               reject({ error });
//             }
//           });
//           this.store.dispatch(
//             writeAction.queryByEntityId({
//               tx_id: tid,
//               args: { id, entityName, collection: this.collection }
//             })
//           );
//         }),
//       getByEntityName: () =>
//         new Promise<{ data: TEntity[] }>((resolve, reject) => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { write } = this.store.getState();
//             const { tx_id, result, error, type } = write;
//
//             if (tx_id === tid && type === writeAction.QUERY_SUCCESS) {
//               unsubscribe();
//               resolve({
//                 data: fromCommitsToGroupByEntityId<TEntity>(result, reducer)
//               });
//             }
//             if (tx_id === tid && type === writeAction.QUERY_ERROR) {
//               unsubscribe();
//               reject({ error });
//             }
//           });
//           this.store.dispatch(
//             writeAction.queryByEntityName({
//               tx_id: tid,
//               args: { entityName, collection: this.collection }
//             })
//           );
//         }),
//       deleteByEntityIdCommitId: (id, commitId) =>
//         new Promise<any>((resolve, reject) => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { tx_id, result, error, type } = this.store.getState().write;
//             if (tx_id === tid && type === writeAction.DELETE_SUCCESS) {
//               unsubscribe();
//               resolve(result);
//             }
//             if (tx_id === tid && type === writeAction.DELETE_ERROR) {
//               unsubscribe();
//               reject({ error });
//             }
//           });
//           this.store.dispatch(
//             writeAction.deleteByEntityIdCommitId({
//               tx_id: tid,
//               args: { entityName, id, commitId, collection: this.collection }
//             })
//           );
//         })
//     };
//   }
//
//   getRepository<TEntity, TEvent>({
//                                    entityName,
//                                    reducer
//                                  }): Repository<TEntity, TEvent> {
//     return {
//       create: id => ({
//         save: events =>
//           getPromiseToSave({
//             id,
//             entityName,
//             version: 0,
//             events,
//             store: this.store
//           })
//       }),
//       getById: id =>
//         new Promise<{
//           currentState: TEntity;
//           save: (events: TEvent[]) => Promise<Commit | { error: any }>;
//         }>(resolve => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { query } = this.store.getState();
//             const { tx_id, result, type } = query;
//
//             // todo: double check if there is chance for QueryError, especially when later changing to external QueryDB
//             if (tx_id === tid && type === queryAction.QUERY_SUCCESS) {
//               unsubscribe();
//               resolve({
//                 currentState: reducer(getHistory(result)),
//                 save: events =>
//                   getPromiseToSave({
//                     id,
//                     entityName,
//                     events,
//                     version: keys(result).length,
//                     store: this.store
//                   })
//               });
//             }
//           });
//           this.store.dispatch(
//             queryAction.queryByEntityId({
//               tx_id: tid,
//               args: { id, entityName }
//             })
//           );
//         }),
//       getByEntityName: () =>
//         new Promise<{ data: TEntity[] }>(resolve => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { query } = this.store.getState();
//             const { tx_id, result, type } = query;
//
//             // todo: double check if there is chance for QueryError, especially when later changing to external QueryDB
//             if (tx_id === tid && type === queryAction.QUERY_SUCCESS) {
//               unsubscribe();
//               resolve({
//                 data: fromCommitsToGroupByEntityId<TEntity>(result, reducer)
//               });
//             }
//           });
//           this.store.dispatch(
//             queryAction.queryByEntityName({
//               tx_id: tid,
//               args: { entityName }
//             })
//           );
//         }),
//       getCommitById: id =>
//         new Promise<{ data: Commit[] }>(resolve => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { query } = this.store.getState();
//             const { tx_id, result, type } = query;
//
//             // todo: double check if there is chance for QueryError, especially when later changing to external QueryDB
//             if (tx_id === tid && type === queryAction.QUERY_SUCCESS) {
//               unsubscribe();
//               resolve({ data: values(result).reverse() });
//             }
//           });
//           this.store.dispatch(
//             queryAction.queryByEntityId({
//               tx_id: tid,
//               args: { id, entityName }
//             })
//           );
//         }),
//       getProjection: criteria =>
//         new Promise<{ data: TEntity[] }>(resolve => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { projection } = this.store.getState();
//             const { tx_id, result: data, type } = projection;
//
//             // todo: double check if there is chance for QueryError, especially when later changing to external QueryDB
//             if (tx_id === tid && type === projectionAction.FIND_SUCCESS) {
//               unsubscribe();
//               resolve({ data });
//             }
//           });
//           this.store.dispatch(
//             projectionAction.find({
//               tx_id: tid,
//               args: criteria,
//               store: this.store
//             })
//           );
//         }),
//       deleteByEntityId: id =>
//         new Promise<any>((resolve, reject) => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { tx_id, result, error, type } = this.store.getState().write;
//             if (tx_id === tid && type === writeAction.DELETE_SUCCESS) {
//               unsubscribe();
//               resolve(result);
//             }
//             if (tx_id === tid && type === writeAction.DELETE_ERROR) {
//               unsubscribe();
//               reject({ error });
//             }
//           });
//           this.store.dispatch(
//             writeAction.deleteByEntityId({
//               tx_id: tid,
//               args: { entityName, id }
//             })
//           );
//         }),
//       deleteByEntityName_query: () =>
//         new Promise<any>(resolve => {
//           const tid = generateToken();
//           const unsubscribe = this.store.subscribe(() => {
//             const { tx_id, result, type } = this.store.getState().query;
//
//             // todo: double check if there is chance for QueryError, especially when later changing to external QueryDB
//             if (tx_id === tid && type === queryAction.DELETE_SUCCESS) {
//               unsubscribe();
//               resolve(result);
//             }
//           });
//           this.store.dispatch(
//             queryAction.deleteByEntityName({ tx_id: tid, args: { entityName } })
//           );
//         })
//     };
//   }
//
//   reconcile({ entityName, reducer }) {
//     return new Promise<{ result: any }>((resolve, reject) => {
//       const tid = generateToken();
//       const unsubscribe = this.store.subscribe(() => {
//         const { tx_id, result, error, type } = this.store.getState().reconcile;
//         if (tx_id === tid && type === reconcileAction.RECONCILE_SUCCESS) {
//           unsubscribe();
//           resolve({ result });
//         }
//         if (tx_id === tid && type === reconcileAction.RECONCILE_ERROR) {
//           unsubscribe();
//           reject({ error });
//         }
//       });
//       this.store.dispatch(
//         reconcileAction.reconcile({
//           tx_id: tid,
//           args: { entityName, reducer },
//           store: this.store
//         })
//       );
//     });
//   }
//
//   async subscribeHub() {
//     this.registerId = await channelEventHub(
//       this.option.channelHub
//     ).registerCCEvent({
//       onChannelEventArrived: ({ commit }) => {
//         const tid = generateToken();
//         console.log('subscribeHub running');
//         this.store.dispatch(
//           queryAction.merge({ tx_id: tid, args: { commit } })
//         );
//       }
//     });
//   }
//
//   unsubscribeHub() {
//     this.option.channelHub.unregisterChaincodeEvent(this.registerId, true);
//   }
//
//   disconnect() {
//     this.option.gateway.disconnect();
//   }
// }
