import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ProjectionDb, Reducer } from '../../../types';
import { action } from '../action';
import { UpsertManyAction } from '../types';

export default (
  action$: Observable<UpsertManyAction>,
  _,
  context: { projectionDb: ProjectionDb; reducer: Reducer }
) =>
  action$.pipe(
    ofType(action.UPSERT_MANY),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { commits } }) =>
      from(
        context.projectionDb
          .upsertMany({ commits, reducer: context.reducer })
          .then(({ data }) => action.upsertManySuccess({ tx_id, result: data }))
      )
    )
  );
