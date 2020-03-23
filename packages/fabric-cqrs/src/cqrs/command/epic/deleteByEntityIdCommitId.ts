/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { submit$, submitPrivateData$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { DeleteByEntityIdCommitIdAction } from '../types';

export default (action$: Observable<DeleteByEntityIdCommitIdAction>, _, context) => {
  const logger = Client.getLogger('deleteByEntityIdCommitId.js');

  return action$.pipe(
    ofType(action.DELETE_BY_ENTITYID_COMMITID),
    mergeMap(({ payload: { tx_id, args: { id, entityName, commitId, collection } } }) =>
      collection
        ? submitPrivateData$(
            'privatedata:deleteByEntityIdCommitId',
            [collection, entityName, id, commitId],
            null,
            context
          ).pipe(
            tap(commits => logger.debug(util.format('dispatch submitPrivateData response: %j', commits))),
            dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
          )
        : submit$('deleteByEntityIdCommitId', [entityName, id, commitId], context).pipe(
            tap(commits => logger.debug(util.format('dispatch submit response: %j', commits))),
            dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
          )
    )
  );
};
