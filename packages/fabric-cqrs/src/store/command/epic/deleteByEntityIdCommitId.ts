/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { submit$, submitPrivateData$ } from '../../../utils/services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import type { DeleteByEntityIdCommitIdAction } from '../types';

const { DELETE_BY_ENTITYID_COMMITID, deleteError, deleteSuccess } = action;

export default (action$: Observable<DeleteByEntityIdCommitIdAction>, _, context) =>
  action$.pipe(
    ofType(DELETE_BY_ENTITYID_COMMITID),
    mergeMap(({ payload: { tx_id, args: { id, entityName, commitId, isPrivateData } } }) =>
      isPrivateData
        ? submitPrivateData$(
            'privatedata:deleteByEntityIdCommitId',
            [entityName, id, commitId],
            null,
            context
          ).pipe(
            tap((commits) =>
              context.logger.debug(
                util.format(
                  '[store/command/deleteByEntityIdCommitId.js] dispatch submitPrivateData response: %j',
                  commits
                )
              )
            ),
            dispatchResult(tx_id, deleteSuccess, deleteError)
          )
        : submit$('eventstore:deleteByEntityIdCommitId', [entityName, id, commitId], context).pipe(
            tap((commits) =>
              context.logger.debug(
                util.format(
                  '[store/command/deleteByEntityIdCommitId.js] dispatch submit response: %j',
                  commits
                )
              )
            ),
            dispatchResult(tx_id, deleteSuccess, deleteError)
          )
    )
  );
