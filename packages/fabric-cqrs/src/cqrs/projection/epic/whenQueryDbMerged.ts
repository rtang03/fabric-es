import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ProjectionDb, QueryDatabase, Reducer } from '../../../types';
import { action as queryAction } from '../../query/action';
import { action } from '../action';

export default (
  action$: Observable<{
    type: string;
    payload: { tx_id; args: { entityName: string; id: string } };
  }>,
  _,
  context: {
    projectionDb: ProjectionDb;
    queryDatabase: QueryDatabase;
    reducer: Reducer;
  }
) => {
  const logger = Client.getLogger('whenQueryDbMerged.js');

  return action$.pipe(
    ofType(queryAction.MERGE_SUCCESS),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, id } }) =>
      from(
        context.queryDatabase.queryByEntityId({ entityName, id }).then(({ data }) => {
          logger.info('whenQueryDbMerged done');
          return action.upsert({ tx_id, args: { commit: data } });
        })
      )
    )
  );
};
