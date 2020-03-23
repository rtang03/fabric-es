/**
 * @packageDocumentation
 * @hidden
 */
import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ProjectionDb, Reducer } from '../../../types';
import { action } from '../action';
import { UpsertAction } from '../types';

export default (action$: Observable<UpsertAction>, _, context: { projectionDb: ProjectionDb; reducer: Reducer }) => {
  const logger = Client.getLogger('upsert.js');

  return action$.pipe(
    ofType(action.UPSERT),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { commit } }) =>
      from(
        context.projectionDb.upsert({ commit, reducer: context.reducer }).then(({ data }) => {
          logger.info('projectionDb upsert successful');

          return action.upsertSuccess({ tx_id, result: data });
        })
      )
    )
  );
};
