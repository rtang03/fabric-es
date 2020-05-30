import util from 'util';
import { Reducer } from '@fabric-es/fabric-cqrs';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { QueryDatabase } from '../../../types';
import { getLogger } from '../../../utils';
import { action } from '../action';
import type { MergeEntityAction } from '../types';

export default (
  action$: Observable<MergeEntityAction>,
  _,
  { queryDatabase, reducers }: { queryDatabase: QueryDatabase; reducers: Record<string, Reducer> }
) => {
  const logger = getLogger({ name: '[query-handler] store/projection/mergeEntity.js' });
  const { MERGE_ENTITY, mergeEntityError, mergeEntitySuccess } = action;

  return action$.pipe(
    ofType(MERGE_ENTITY),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { commit } }) => {
      const { entityName } = commit;
      const reducer: Reducer = reducers[entityName];

      return from(
        reducer
          ? queryDatabase
              .mergeEntity({ commit, reducer })
              .then(({ result }) => mergeEntitySuccess({ tx_id, result }))
              .catch((error) => {
                logger.warn(util.format('fail to %s: %s, %j', MERGE_ENTITY, entityName, error));
                return mergeEntityError({ tx_id, error });
              })
          : Promise.resolve(
              mergeEntityError({
                tx_id,
                error: `entityName ${entityName}: reducer not found`,
              })
            )
      );
    })
  );
};
