/**
 * @packageDocumentation
 * @hidden
 */
import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { action } from '../action';
import { DeleteByEntityIdAction } from '../types';

export default (action$: Observable<DeleteByEntityIdAction>, _, context: { queryDatabase: QueryDatabase }) => {
  const logger = Client.getLogger('queryByEntityName.js');

  return action$.pipe(
    ofType(action.DELETE_BY_ENTITY_ID),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, id } }) =>
      from(
        context.queryDatabase.deleteByEntityId({ entityName, id }).then(result => {
          logger.info(action.DELETE_SUCCESS);

          return action.deleteSuccess({ tx_id, result });
        })
      )
    )
  );
};
