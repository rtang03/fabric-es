/**
 * @packageDocumentation
 * @hidden
 */
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import evaluate$ from '../../../services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import type { QueryByEntIdCommitIdAction } from '../types';

export default (action$: Observable<QueryByEntIdCommitIdAction>, _, context) =>
  action$.pipe(
    ofType(action.QUERY_BY_ENTITYID_COMMITID),
    mergeMap(({ payload: { tx_id, args: { id, entityName, commitId, isPrivateData } } }) =>
      isPrivateData
        ? evaluate$(
            'privatedata:queryByEntityIdCommitId',
            [entityName, id, commitId],
            context
          ).pipe(dispatchResult(tx_id, action.querySuccess, action.queryError))
        : evaluate$('eventstore:queryByEntityIdCommitId', [entityName, id, commitId], context).pipe(
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
    )
  );
