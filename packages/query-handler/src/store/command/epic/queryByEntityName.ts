import util from 'util';
import { dispatchResult, evaluate$ } from '@fabric-es/fabric-cqrs';
import { Utils } from 'fabric-common';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { action } from '../action';
import { QueryByEntityNameAction } from '../types';

export default (action$: Observable<QueryByEntityNameAction>, _, context) => {
  const logger = Utils.getLogger('[query-handler] queryByEntityName.js');

  return action$.pipe(
    ofType(action.QUERY_BY_ENTITY_NAME),
    mergeMap(({ payload: { tx_id, args: { entityName, isPrivateData } } }) =>
      isPrivateData
        ? evaluate$('privatedata:queryByEntityName', [entityName], context, true).pipe(
            tap(commits => logger.debug(util.format('dispatch evaluate response: %j', commits))),
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
        : evaluate$('eventstore:queryByEntityName', [entityName], context, false).pipe(
            tap(commits => logger.debug(util.format('dispatch evaluate response: %j', commits))),
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
    )
  );
};
