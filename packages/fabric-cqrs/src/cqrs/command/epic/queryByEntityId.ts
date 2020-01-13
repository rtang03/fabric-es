import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import util from 'util';
import evaluate$ from '../../../services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { QueryByEntityIdAction } from '../types';

export default (action$: Observable<QueryByEntityIdAction>, _, context) => {
  const logger = Client.getLogger('queryByEntityId.js');

  return action$.pipe(
    ofType(action.QUERY_BY_ENTITY_ID),
    mergeMap(({ payload: { tx_id, args: { entityName, id, collection } } }) =>
      collection
        ? evaluate$(
            'privatedata:queryByEntityId',
            [collection, entityName, id],
            context,
            true
          ).pipe(
            tap(commits =>
              logger.debug(
                util.format('dispatch evaluate response: %j', commits)
              )
            ),
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
        : evaluate$('queryByEntityId', [entityName, id], context).pipe(
            tap(commits =>
              logger.debug(
                util.format('dispatch evaluate response: %j', commits)
              )
            ),
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
    )
  );
};
