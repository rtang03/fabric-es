/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import evaluate$ from '../../../services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { QueryByEntityNameAction } from '../types';

export default (action$: Observable<QueryByEntityNameAction>, _, context) => {
  const logger = Client.getLogger('queryByEntityName.js');

  return action$.pipe(
    ofType(action.QUERY_BY_ENTITY_NAME),
    mergeMap(({ payload: { tx_id, args: { entityName, collection } } }) =>
      collection
        ? evaluate$('privatedata:queryByEntityName', [collection, entityName], context, true).pipe(
            tap(commits => logger.debug(util.format('dispatch evaluate response: %j', commits))),
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
        : evaluate$('queryByEntityName', [entityName], context).pipe(
            tap(commits => logger.debug(util.format('dispatch evaluate response: %j', commits))),
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
    )
  );
};
