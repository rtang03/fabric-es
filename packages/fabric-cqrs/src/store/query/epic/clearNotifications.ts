import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabaseV2 } from '../../../queryHandlerV2/types';
import { action } from '../action';
import type { ClearNotificationsAction } from '../types';

const { CLEAR_NOTIFICATIONS, clearNotiSuccess, clearNotiError } = action;

export default (
  action$: Observable<ClearNotificationsAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabaseV2; logger: Logger }
) =>
  action$.pipe(
    ofType(CLEAR_NOTIFICATIONS),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { creator, entityName, id } }) =>
      from(
        queryDatabase
          .clearNotifications({ creator, entityName, id })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? clearNotiSuccess({ tx_id, result: data })
              : clearNotiError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/clearNotifications.js] fail to %s: tx_id:%s, %j',
                CLEAR_NOTIFICATIONS,
                tx_id,
                error
              )
            );
            return clearNotiError({ tx_id, error: error.message });
          })
      )
    )
  );
