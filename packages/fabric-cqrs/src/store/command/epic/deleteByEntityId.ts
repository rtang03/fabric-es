/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { submit$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import type { DeleteByEntityIdAction } from '../types';

const { DELETE_BY_ENTITYID, deleteSuccess, deleteError } = action;

// note: because of private data limitation.
// DeleteByByEntityId cannot be implemented, for private data
export default (action$: Observable<DeleteByEntityIdAction>, _, context) =>
  action$.pipe(
    ofType(DELETE_BY_ENTITYID),
    mergeMap(({ payload: { tx_id, args: { id, entityName } } }) =>
      submit$('eventstore:deleteByEntityId', [entityName, id], context).pipe(
        tap((commits) => {
          context.logger.debug(
            util.format(
              '[store/command/deleteByEntityId.js] dispatch deleteByEntityId response: %j',
              commits
            )
          );
        }),
        dispatchResult(tx_id, deleteSuccess, deleteError)
      )
    )
  );
