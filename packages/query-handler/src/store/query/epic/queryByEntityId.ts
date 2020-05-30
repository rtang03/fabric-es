import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { getLogger } from '../../../utils';
import { action } from '../action';
import { QueryByEntityIdAction } from '../types';

export default (
  action$: Observable<QueryByEntityIdAction>,
  _,
  { queryDatabase }: { queryDatabase: QueryDatabase }
) =>
  action$.pipe(
    ofType(action.QUERY_BY_ENTITY_ID),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, id } }) =>
      from(
        queryDatabase.queryCommitByEntityId({ entityName, id }).then(({ result }) => {
          const logger = getLogger({ name: '[query-handler] queryByEntityName.js' });
          logger.info(action.QUERY_SUCCESS);

          return action.querySuccess({ tx_id, result });
        })
      )
    )
  );
