import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import evaluate$ from '../../../services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { QueryByEntityIdAction } from '../types';

export default (action$: Observable<QueryByEntityIdAction>, _, context) =>
  action$.pipe(
    ofType(action.QUERY_BY_ENTITY_ID),
    mergeMap(({ payload: { tx_id, args: { entityName, id, collection } } }) =>
      collection
        ? evaluate$(
            'privatedata:queryByEntityId',
            [collection, entityName, id],
            context,
            true
          ).pipe(dispatchResult(tx_id, action.querySuccess, action.queryError))
        : evaluate$('queryByEntityId', [entityName, id], context).pipe(
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
    )
  );
