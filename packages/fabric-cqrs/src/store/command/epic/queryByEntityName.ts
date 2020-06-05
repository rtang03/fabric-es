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
import type { QueryByEntityNameAction } from '../types';

const { QUERY_BY_ENTITY_NAME, querySuccess, queryError } = action;

export default (action$: Observable<QueryByEntityNameAction>, _, context) =>
  action$.pipe(
    ofType(QUERY_BY_ENTITY_NAME),
    mergeMap(({ payload: { tx_id, args: { entityName, isPrivateData } } }) =>
      isPrivateData
        ? evaluate$('privatedata:queryByEntityName', [entityName], context).pipe(
            dispatchResult(tx_id, querySuccess, queryError)
          )
        : evaluate$('eventstore:queryByEntityName', [entityName], context).pipe(
            dispatchResult(tx_id, querySuccess, queryError)
          )
    )
  );
