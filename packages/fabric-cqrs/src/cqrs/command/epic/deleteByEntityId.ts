import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { submit$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { DeleteByEntityIdAction } from '../types';

// note: because of private data limitation.
// DeleteByByEntityId cannot be implemented, for private data
export default (action$: Observable<DeleteByEntityIdAction>, _, context) =>
  action$.pipe(
    ofType(action.DELETE_BY_ENTITYID),
    mergeMap(({ payload: { tx_id, args: { id, entityName } } }) =>
      submit$('deleteByEntityId', [entityName, id], context).pipe(
        dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
      )
    )
  );
