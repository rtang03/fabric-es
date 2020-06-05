/**
 * @packageDocumentation
 * @hidden
 */
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import evaluate$ from '../../../utils/services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import type { QueryByEntityIdAction } from '../types';

export default (action$: Observable<QueryByEntityIdAction>, _, context) =>
  action$.pipe(
    ofType(action.QUERY_BY_ENTITY_ID),
    mergeMap(({ payload: { tx_id, args: { entityName, id, isPrivateData } } }) =>
      isPrivateData
        ? evaluate$('privatedata:queryByEntityId', [entityName, id], context).pipe(
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
        : evaluate$('eventstore:queryByEntityId', [entityName, id], context).pipe(
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
    )
  );
