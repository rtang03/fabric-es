import { Utils } from 'fabric-common';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProjectionDatabase, QueryDatabase } from '../../../types';
import { action as queryAction } from '../../query/action';
import { action } from '../action';
import { Commit, Reducer } from '@fabric-es/fabric-cqrs';

type InputType = {
  type: string;
  payload: {
    tx_id;
    args: { entityName: string; commits: Record<string, Commit> };
  };
};

export default (
  action$: Observable<InputType>,
  _,
  context: {
    projectionDb: ProjectionDatabase;
    queryDatabase: QueryDatabase;
    reducer: Reducer;
  }
) =>
  action$.pipe(
    ofType(queryAction.MERGE_BATCH_SUCCESS),
    map(({ payload }) => payload),
    map(({ tx_id, args: { commits } }) => action.upsertMany({ tx_id, args: { commits } }))
  );
