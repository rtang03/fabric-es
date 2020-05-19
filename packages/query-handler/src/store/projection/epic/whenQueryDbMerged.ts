import { Reducer } from '@fabric-es/fabric-cqrs';
import { Utils } from 'fabric-common';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ProjectionDatabase, QueryDatabase } from '../../../types';
import { action as queryAction } from '../../query/action';
import { action } from '../action';

export default (
  action$: Observable<{
    type: string;
    payload: { tx_id; args: { entityName: string; id: string } };
  }>,
  _,
  context: {
    projectionDb: ProjectionDatabase;
    queryDatabase: QueryDatabase;
    reducer: Reducer;
  }
) =>
  action$.pipe(
    ofType(queryAction.MERGE_SUCCESS),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, id } }) =>
      from(
        context.queryDatabase.queryByEntityId({ entityName, id }).then(({ data }) => {
          const logger = Utils.getLogger('[fabric-cqrs] whenQueryDbMerged.js');
          logger.info('whenQueryDbMerged done');

          return action.upsert({ tx_id, args: { commit: data } });
        })
      )
    )
  );
