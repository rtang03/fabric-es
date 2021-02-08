import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabaseV2 } from '../../../queryHandlerV2/types';
import { action } from '../action';
import type { DeleteCommitByEntityNameAction } from '../types';

const { DELETE_COMMIT_BY_ENTITYNAME, deleteSuccess, deleteError } = action;

export default (
  action$: Observable<DeleteCommitByEntityNameAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabaseV2; logger: Logger }
) =>
  action$.pipe(
    ofType(DELETE_COMMIT_BY_ENTITYNAME),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName } }) =>
      from(
        queryDatabase
          .deleteCommitByEntityName({ entityName })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? deleteSuccess({ tx_id, result: data })
              : deleteError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/deleteByEntityName.js] fail to %s: %j',
                DELETE_COMMIT_BY_ENTITYNAME,
                error
              )
            );
            return deleteError({ tx_id, error: error.message });
          })
      )
    )
  );
