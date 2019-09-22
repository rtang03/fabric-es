import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import evaluate$ from '../../../services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { QueryByEntIdCommitIdAction } from '../types';

export default (action$: Observable<QueryByEntIdCommitIdAction>, _, context) =>
  action$.pipe(
    ofType(action.QUERY_BY_ENTITYID_COMMITID),
    mergeMap(
      ({
        payload: {
          tx_id,
          args: { id, entityName, commitId, collection }
        }
      }) =>
        collection
          ? evaluate$(
              'privatedata:queryByEntityIdCommitId',
              [collection, entityName, id, commitId],
              context,
              true
            ).pipe(
              dispatchResult(tx_id, action.querySuccess, action.queryError)
            )
          : evaluate$(
              'queryByEntityIdCommitId',
              [entityName, id, commitId],
              context
            ).pipe(
              dispatchResult(tx_id, action.querySuccess, action.queryError)
            )
    )
  );
