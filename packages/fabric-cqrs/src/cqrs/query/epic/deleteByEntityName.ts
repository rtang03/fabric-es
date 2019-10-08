import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { action } from '../action';
import { DeleteByEntityNameAction } from '../types';

export default (
  action$: Observable<DeleteByEntityNameAction>,
  _,
  context: { queryDatabase: QueryDatabase }
) =>
  action$.pipe(
    ofType(action.DELETE_BY_ENTITYNAME),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName } }) =>
      from(
        context.queryDatabase
          .deleteByEntityName({ entityName })
          .then(result => action.deleteSuccess({ tx_id, result }))
      )
    )
  );