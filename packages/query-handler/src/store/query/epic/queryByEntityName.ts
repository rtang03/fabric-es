import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { QueryDatabase } from '../../../types';
import { action } from '../action';
import { QueryByEntityNameAction } from '../types';
import { getLogger } from '../../../utils';

export default (action$: Observable<QueryByEntityNameAction>, _, context: { queryDatabase: QueryDatabase }) =>
  action$.pipe(
    ofType(action.QUERY_BY_ENTITYNAME),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName } }) =>
      from(
        context.queryDatabase.queryByEntityName({ entityName }).then(({ data }) => {
          const logger = getLogger({ name: '[query-handler] queryByEntityName.js' });
          logger.info(action.QUERY_SUCCESS);

          return action.querySuccess({ tx_id, result: data });
        })
      )
    )
  );
