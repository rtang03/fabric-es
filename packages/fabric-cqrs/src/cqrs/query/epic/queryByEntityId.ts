import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { action } from '../action';
import { QueryByEntityIdAction } from '../types';

export default (
  action$: Observable<QueryByEntityIdAction>,
  _,
  context: { queryDatabase: QueryDatabase }
) =>
  action$.pipe(
    ofType(action.QUERY_BY_ENTITY_ID),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, id } }) =>
      from(
        context.queryDatabase
          .queryByEntityId({ entityName, id })
          .then(({ data }) => action.querySuccess({ tx_id, result: data }))
      )
    )
  );
