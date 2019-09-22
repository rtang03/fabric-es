import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { action } from '../action';
import { DeleteByEntityIdAction } from '../types';

export default (
  action$: Observable<DeleteByEntityIdAction>,
  _,
  context: { queryDatabase: QueryDatabase }
) =>
  action$.pipe(
    ofType(action.DELETE_BY_ENTITY_ID),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, id } }) =>
      from(
        context.queryDatabase
          .deleteByEntityId({ entityName, id })
          .then(result => action.deleteSuccess({ tx_id, result }))
      )
    )
  );
