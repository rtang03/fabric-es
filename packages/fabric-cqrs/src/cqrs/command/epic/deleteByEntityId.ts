/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { Utils } from 'fabric-common';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
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
      submit$('eventstore:deleteByEntityId', [entityName, id], context).pipe(
        tap(commits => {
          const logger = Utils.getLogger('[fabric-cqrs] deleteByEntityId.js');
          logger.debug(util.format('dispatch deleteByEntityId response: %j', commits));
        }),
        dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
      )
    )
  );
