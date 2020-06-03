// /**
//  * @packageDocumentation
//  * @hidden
//  */
// import util from 'util';
// import { Utils } from 'fabric-common';
// import { ofType } from 'redux-observable';
// import { Observable } from 'rxjs';
// import { mergeMap, tap } from 'rxjs/operators';
// import evaluate$ from '../../../services/evaluate';
// import { dispatchResult } from '../../utils';
// import { action } from '../action';
// import { QueryByEntityIdAction } from '../types';
//
// export default (action$: Observable<QueryByEntityIdAction>, _, context) => {
//   const logger = Utils.getLogger('[fabric-cqrs] queryByEntityId.js');
//
//   return action$.pipe(
//     ofType(action.QUERY_BY_ENTITY_ID),
//     mergeMap(({ payload: { tx_id, args: { entityName, id, isPrivateData } } }) =>
//       isPrivateData
//         ? evaluate$('privatedata:queryByEntityId', [entityName, id], context, true).pipe(
//         tap(commits => logger.debug(util.format('dispatch evaluate response: %j', commits))),
//         dispatchResult(tx_id, action.querySuccess, action.queryError)
//         )
//         : evaluate$('eventstore:queryByEntityId', [entityName, id], context, false).pipe(
//         tap(commits => logger.debug(util.format('dispatch evaluate response: %j', commits))),
//         dispatchResult(tx_id, action.querySuccess, action.queryError)
//         )
//     )
//   );
// };
