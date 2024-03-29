import util from 'util';
import isEqual from 'lodash/isEqual';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../../../queryHandler/types';
import { action } from '../action';
import type { QueryByEntityIdAction } from '../types';

const { QUERY_BY_ENTITY_ID, queryError, querySuccess } = action;

export default (
  action$: Observable<QueryByEntityIdAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabase; logger: Logger }
) =>
  action$.pipe(
    ofType(QUERY_BY_ENTITY_ID),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, id } }) =>
      from(
        queryDatabase
          .queryCommitByEntityId({ entityName, id })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? querySuccess({ tx_id, result: data })
              : queryError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/queryByEntityId.js] fail to %s: %j',
                QUERY_BY_ENTITY_ID,
                error
              )
            );
            return queryError({ tx_id, error: error.message });
          })
      )
    )
  );
