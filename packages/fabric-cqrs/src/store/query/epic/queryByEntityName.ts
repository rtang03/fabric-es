import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../../../queryHandler/types';
import { action } from '../action';
import type { QueryByEntityNameAction } from '../types';

const { QUERY_BY_ENTITYNAME, querySuccess, queryError } = action;

export default (
  action$: Observable<QueryByEntityNameAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabase; logger: Logger }
) =>
  action$.pipe(
    ofType(QUERY_BY_ENTITYNAME),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName } }) =>
      from(
        queryDatabase
          .queryCommitByEntityName({ entityName })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? querySuccess({ tx_id, result: data })
              : queryError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/queryByEntityName.js] fail to %s: %j',
                QUERY_BY_ENTITYNAME,
                error
              )
            );
            return queryError({ tx_id, error: error.message });
          })
      )
    )
  );
