import util from 'util';
import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { submit$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { DeleteByEntityIdAction } from '../types';

// note: because of private data limitation.
// DeleteByByEntityId cannot be implemented, for private data
export default (action$: Observable<DeleteByEntityIdAction>, _, context) => {
  const logger = Client.getLogger('deleteByEntityId.js');

  return action$.pipe(
    ofType(action.DELETE_BY_ENTITYID),
    mergeMap(
      ({
        payload: {
          tx_id,
          args: { id, entityName }
        }
      }) => {
        logger.debug(util.format('input_args: %j', { id, entityName }));

        return submit$('deleteByEntityId', [entityName, id], context).pipe(
          tap(commits => {
            logger.debug(util.format('dispatch deleteByEntityId response: %j', commits));
          }),
          dispatchResult(tx_id, action.deleteSuccess, action.deleteError)
        );
      }
    )
  );
};
