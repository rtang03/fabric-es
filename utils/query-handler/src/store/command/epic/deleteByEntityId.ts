import util from 'util';
import { dispatchResult, submit$ } from '@fabric-es/fabric-cqrs';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { action } from '../action';
import { DeleteByEntityIdAction } from '../../../../../../deployments/dev-net/types';

const { DELETE_BY_ENTITYID, deleteSuccess, deleteError } = action;

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
