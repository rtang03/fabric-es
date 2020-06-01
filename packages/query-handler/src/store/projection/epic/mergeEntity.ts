import util from 'util';
import { Reducer } from '@fabric-es/fabric-cqrs';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../../../types';
import { action } from '../action';
import type { MergeEntityAction } from '../types';

const { MERGE_ENTITY, mergeEntityError, mergeEntitySuccess } = action;

export default (
  action$: Observable<MergeEntityAction>,
  _,
  {
    queryDatabase,
    reducers,
    logger,
  }: { queryDatabase: QueryDatabase; reducers: Record<string, Reducer>; logger: Logger }
) =>
  action$.pipe(
    ofType(MERGE_ENTITY),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { commit } }) => {
      let promise: Promise<any>;
      let reducer: Reducer;

      if (!commit || !reducers) {
        promise = Promise.resolve(mergeEntityError({ tx_id, error: `invalid input argument` }));
      } else {
        reducer = reducers[commit.entityName];

        promise = reducer
          ? queryDatabase
              .mergeEntity({ commit, reducer })
              .then(({ result }) => mergeEntitySuccess({ tx_id, result }))
              .catch((error) => {
                logger.warn(
                  util.format(
                    '[store/projection/mergeEntity.js] fail to %s: %s, %j',
                    MERGE_ENTITY,
                    commit.entityName,
                    error
                  )
                );
                return mergeEntityError({ tx_id, error });
              })
          : Promise.resolve(
              mergeEntityError({
                tx_id,
                error: `entityName ${commit.entityName}: reducer not found`,
              })
            );
      }

      return from(promise);
    })
  );
