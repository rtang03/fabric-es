import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Commit, ProjectionDb, QueryDatabase, Reducer } from '../../../types';
import { action as queryAction } from '../../query/action';
import { action } from '../action';

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
    projectionDb: ProjectionDb;
    queryDatabase: QueryDatabase;
    reducer: Reducer;
  }
) => {
  return action$.pipe(
    ofType(queryAction.MERGE_BATCH_SUCCESS),
    map(({ payload }) => payload),
    map(({ tx_id, args: { commits } }) => {
      return action.upsertMany({ tx_id, args: { commits } });
    })
  );
};
