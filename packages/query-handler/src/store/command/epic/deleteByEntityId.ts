import util from 'util';
import { dispatchResult, submit$ } from '@fabric-es/fabric-cqrs';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { getLogger } from '../../../utils';
import { action } from '../action';
import { DeleteByEntityIdAction } from '../types';

export default (action$: Observable<DeleteByEntityIdAction>, _, context) =>
  action$.pipe(
    ofType(action.DELETE_BY_ENTITYID),
    mergeMap(({ payload: { tx_id, args: { id, entityName } } }) =>
      submit$('eventstore:deleteByEntityId', [entityName, id], context).pipe(
        tap((commits) => {
          const logger = getLogger({ name: '[query-handler] deleteByEntityId.js' });
          logger.debug(util.format('dispatch deleteByEntityId response: %j', commits));
        }),
        dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
      )
    )
  );
