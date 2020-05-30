import util from 'util';
import { Reducer } from '@fabric-es/fabric-cqrs';
import { isEqual } from 'lodash';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { QueryDatabase } from '../../../types';
import { getLogger } from '../../../utils';
import { action } from '../action';
import type { MergeEntityBatchAction } from '../types';

export default (
  action$: Observable<MergeEntityBatchAction>,
  _,
  { queryDatabase, reducers }: { queryDatabase: QueryDatabase; reducers: Record<string, Reducer> }
) => {
  const logger = getLogger({ name: '[query-handler] store/projection/mergeEntityBatch.js' });
  const { MERGE_ENTITY_BATCH, mergeEntityBatchError, mergeEntityBatchSuccess } = action;

  return action$.pipe(
    ofType(MERGE_ENTITY_BATCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits } }) => {
      const reducer: Reducer = reducers[entityName];

      return from(
        isEqual(commits, {})
          ? Promise.resolve(mergeEntityBatchSuccess({ tx_id, result: null }))
          : reducer
          ? queryDatabase
              .mergeEntityBatch({ entityName, commits, reducer })
              .then(({ result }) => mergeEntityBatchSuccess({ tx_id, result }))
              .catch((error) => {
                logger.warn(
                  util.format('fail to %s: %s, %j', MERGE_ENTITY_BATCH, entityName, error)
                );
                return mergeEntityBatchError({ tx_id, error });
              })
          : Promise.resolve(
              mergeEntityBatchError({ tx_id, error: `entityName ${entityName}: reducer not found` })
            )
      );
    })
  );
};
