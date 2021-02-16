// import util from 'util';
// import { ofType } from 'redux-observable';
// import { from, Observable } from 'rxjs';
// import { map, mergeMap } from 'rxjs/operators';
// import type { Logger } from 'winston';
// import type { QueryDatabase } from '../../../types';
// import { action } from '../action';
// import type { DeleteCommitByEntityNameAction } from '../types';
//
// const { DELETE_COMMIT_BY_ENTITYNAME, deleteSuccess, deleteError } = action;
//
// export default (
//   action$: Observable<DeleteCommitByEntityNameAction>,
//   _,
//   { queryDatabase, logger }: { queryDatabase: QueryDatabase; logger: Logger }
// ) =>
//   action$.pipe(
//     ofType(DELETE_COMMIT_BY_ENTITYNAME),
//     map(({ payload }) => payload),
//     mergeMap(({ tx_id, args: { entityName } }) =>
//       from(
//         queryDatabase
//           .deleteCommitByEntityName({ entityName })
//           .then(({ result }) => deleteSuccess({ tx_id, result }))
//           .catch((error) => {
//             logger.error(
//               util.format(
//                 '[store/query/deleteByEntityName.js] fail to %s: %j',
//                 DELETE_COMMIT_BY_ENTITYNAME,
//                 error
//               )
//             );
//             return deleteError({ tx_id, error: error.message });
//           })
//       )
//     )
//   );
