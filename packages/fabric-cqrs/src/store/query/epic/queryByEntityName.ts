import util from 'util';
import isEqual from 'lodash/isEqual';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../../../types/queryDatabaseV2';
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
          .then(({ result }) =>
            isEqual(result, {})
              ? querySuccess({ tx_id, result: null })
              : querySuccess({ tx_id, result })
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
