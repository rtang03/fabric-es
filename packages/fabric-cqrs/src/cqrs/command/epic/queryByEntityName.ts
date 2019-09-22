import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import evaluate$ from '../../../services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { QueryByEntityNameAction } from '../types';

export default (action$: Observable<QueryByEntityNameAction>, _, context) =>
  action$.pipe(
    ofType(action.QUERY_BY_ENTITY_NAME),
    mergeMap(({ payload: { tx_id, args: { entityName, collection } } }) =>
      collection
        ? evaluate$(
            'privatedata:queryByEntityName',
            [collection, entityName],
            context,
            true
          ).pipe(dispatchResult(tx_id, action.querySuccess, action.queryError))
        : evaluate$('queryByEntityName', [entityName], context).pipe(
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
    )
  );
