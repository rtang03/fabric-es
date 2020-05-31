// /**
//  * @packageDocumentation
//  * @hidden
//  */
// import { Utils } from 'fabric-common';
// import { ofType } from 'redux-observable';
// import { from, Observable } from 'rxjs';
// import { map, mergeMap } from 'rxjs/operators';
// import { ProjectionDb, Reducer } from '../../../types';
// import { action } from '../action';
// import { UpsertAction } from '../types';
//
// export default (action$: Observable<UpsertAction>, _, context: { projectionDb: ProjectionDb; reducer: Reducer }) =>
//   action$.pipe(
//     ofType(action.UPSERT),
//     map(({ payload }) => payload),
//     mergeMap(({ tx_id, args: { commit } }) =>
//       from(
//         context.projectionDb.upsert({ commit, reducer: context.reducer }).then(({ data }) => {
//           const logger = Utils.getLogger('[fabric-cqrs] upsert.js');
//           logger.info('projectionDb upsert successful');
//
//           return action.upsertSuccess({ tx_id, result: data });
//         })
//       )
//     )
//   );
