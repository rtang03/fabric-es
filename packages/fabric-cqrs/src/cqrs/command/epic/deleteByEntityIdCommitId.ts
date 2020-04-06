/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { Utils } from 'fabric-common';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { submit$, submitPrivateData$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { DeleteByEntityIdCommitIdAction } from '../types';

export default (action$: Observable<DeleteByEntityIdCommitIdAction>, _, context) => {
  const logger = Utils.getLogger('[fabric-cqrs] deleteByEntityIdCommitId.js');

  return action$.pipe(
    ofType(action.DELETE_BY_ENTITYID_COMMITID),
    mergeMap(({ payload: { tx_id, args: { id, entityName, commitId, isPrivateData } } }) =>
      isPrivateData
        ? submitPrivateData$('privatedata:deleteByEntityIdCommitId', [entityName, id, commitId], null, context).pipe(
            tap(commits => logger.debug(util.format('dispatch submitPrivateData response: %j', commits))),
            dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
          )
        : submit$('eventstore:deleteByEntityIdCommitId', [entityName, id, commitId], context).pipe(
            tap(commits => logger.debug(util.format('dispatch submit response: %j', commits))),
            dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
          )
    )
  );
};
