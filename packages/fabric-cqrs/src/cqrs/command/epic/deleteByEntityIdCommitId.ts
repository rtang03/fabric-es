import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { submit$, submitPrivateData$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { DeleteByEntityIdCommitIdAction } from '../types';

export default (
  action$: Observable<DeleteByEntityIdCommitIdAction>,
  _,
  context
) =>
  action$.pipe(
    ofType(action.DELETE_BY_ENTITYID_COMMITID),
    mergeMap(
      ({
        payload: {
          tx_id,
          args: { id, entityName, commitId, collection }
        }
      }) =>
        collection
          ? submitPrivateData$(
              'privatedata:deleteByEntityIdCommitId',
              [collection, entityName, id, commitId],
              null,
              context
            ).pipe(
              dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
            )
          : submit$(
              'deleteByEntityIdCommitId',
              [entityName, id, commitId],
              context
            ).pipe(
              dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
            )
    )
  );
