import util from 'util';
import isEqual from 'lodash/isEqual';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabaseV2 } from '../../../queryHandlerV2/types';
import type { Reducer } from '../../../types';
import { action } from '../action';
import type { MergeEntityBatchAction } from '../types';

const { MERGE_ENTITY_BATCH, mergeEntityBatchError, mergeEntityBatchSuccess } = action;

export default (
  action$: Observable<MergeEntityBatchAction>,
  _,
  {
    queryDatabase,
    reducers,
    logger,
  }: { queryDatabase: QueryDatabaseV2; reducers: Record<string, Reducer>; logger: Logger }
) =>
  action$.pipe(
    ofType(MERGE_ENTITY_BATCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits } }) => {
      let promise: Promise<any>;
      let reducer: Reducer;

      if (!commits || !entityName || !reducers) {
        promise = Promise.resolve(
          mergeEntityBatchError({ tx_id, error: `invalid input argument` })
        );
      } else if (isEqual(commits, {})) {
        promise = Promise.resolve(mergeEntityBatchSuccess({ tx_id, result: null }));
      } else {
        reducer = reducers[entityName];

        promise = reducer
          ? queryDatabase
              .mergeEntityBatch({ entityName, commits, reducer })
              .then(({ data, status, errors }) =>
                status === 'OK'
                  ? mergeEntityBatchSuccess({ tx_id, result: data })
                  : mergeEntityBatchError({ tx_id, error: errors })
              )
              .catch((error) => {
                logger.warn(
                  util.format(
                    '[store/projection/mergeEntityBatch.js] fail to %s: %s, %j',
                    MERGE_ENTITY_BATCH,
                    entityName,
                    error
                  )
                );
                return mergeEntityBatchError({ tx_id, error });
              })
          : Promise.resolve(
              mergeEntityBatchError({ tx_id, error: `entityName ${entityName}: reducer not found` })
            );
      }

      return from(promise);
    })
  );
