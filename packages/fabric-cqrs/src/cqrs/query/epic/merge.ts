import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { action } from '../action';
import { MergeAction } from '../types';

export default (
  action$: Observable<MergeAction>,
  _,
  context: { queryDatabase: QueryDatabase }
) => {
  const logger = Client.getLogger('queryByEntityName.js');

  return action$.pipe(
    ofType(action.MERGE),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { commit } }) =>
      from(
        context.queryDatabase.merge({ commit }).then(({ data }) => {
          logger.info(action.MERGE_SUCCESS);

          return action.mergeSuccess({
            tx_id,
            result: data,
            args: { entityName: commit.entityName, id: commit.id }
          });
        })
      )
    )
  );
};
