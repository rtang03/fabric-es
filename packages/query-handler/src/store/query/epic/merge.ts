import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { getLogger } from '../../../utils';
import { action } from '../action';
import { MergeAction } from '../types';

export default (action$: Observable<MergeAction>, _, context: { queryDatabase: QueryDatabase }) =>
  action$.pipe(
    ofType(action.MERGE),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { commit } }) =>
      from(
        context.queryDatabase.merge({ commit }).then((result) => {
          const logger = getLogger({ name: '[query-handler] merge.js' });
          logger.info(action.MERGE_SUCCESS);

          return action.mergeSuccess({
            tx_id,
            result,
            args: { entityName: commit.entityName, id: commit.id },
          });
        })
      )
    )
  );
