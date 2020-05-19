import { Reducer } from '@fabric-es/fabric-cqrs';
import { Utils } from 'fabric-common';
import { isEqual } from 'lodash';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ProjectionDatabase } from '../../../types';
import { action } from '../action';
import { UpsertManyAction } from '../types';

export default (
  action$: Observable<UpsertManyAction>,
  _,
  context: { projectionDb: ProjectionDatabase; reducer: Reducer }
) =>
  action$.pipe(
    ofType(action.UPSERT_MANY),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { commits } }) =>
      from(
        isEqual(commits, {})
          ? Promise.resolve(action.upsertManySuccess({ tx_id, result: null }))
          : context.projectionDb.upsertMany({ commits, reducer: context.reducer }).then(({ data }) => {
              const logger = Utils.getLogger('[fabric-cqrs] upsertMany.js');
              logger.info('projectionDb upsertMany successful');

              return action.upsertManySuccess({ tx_id, result: data });
            })
      )
    )
  );
