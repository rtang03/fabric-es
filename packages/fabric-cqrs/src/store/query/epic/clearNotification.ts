import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabaseV2 } from '../../../queryHandlerV2/types';
import { action } from '../action';
import type { ClearNotificationAction } from '../types';

const { CLEAR_NOTIFICATION, clearNotiSuccess, clearNotiError } = action;

export default (
  action$: Observable<ClearNotificationAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabaseV2; logger: Logger }
) =>
  action$.pipe(
    ofType(CLEAR_NOTIFICATION),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { creator, entityName, commitId, id } }) =>
      from(
        queryDatabase
          .clearNotification({ creator, entityName, commitId, id })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? clearNotiSuccess({ tx_id, result: data })
              : clearNotiError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/clearNotification.js] fail to %s: tx_id:%s, %j',
                CLEAR_NOTIFICATION,
                tx_id,
                error
              )
            );
            return clearNotiError({ tx_id, error: error.message });
          })
      )
    )
  );
