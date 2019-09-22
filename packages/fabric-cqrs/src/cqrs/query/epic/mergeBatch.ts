import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { action } from '../action';
import { MergeBatchAction } from '../types';

export default (
  action$: Observable<MergeBatchAction>,
  _,
  context: { queryDatabase: QueryDatabase }
) =>
  action$.pipe(
    ofType(action.MERGE_BATCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits } }) =>
      from(
        context.queryDatabase
          .mergeBatch({ entityName, commits })
          .then(({ data }) => action.mergeBatchSuccess({ tx_id, result: data }))
      )
    )
  );
