import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabaseV2 } from '../../../queryHandlerV2/types';
import { action } from '../action';
import type { GetNotificationsAction } from '../types';

const { GET_NOTIFICATIONS, getNotiSuccess, getNotiError } = action;

export default (
  action$: Observable<GetNotificationsAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabaseV2; logger: Logger }
) =>
  action$.pipe(
    ofType(GET_NOTIFICATIONS),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { creator, entityName, id } }) =>
      from(
        queryDatabase
          .getNotificationsByFields({ creator, entityName, id })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? getNotiSuccess({ tx_id, result: data })
              : getNotiError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/getNotifications.js] fail to %s: tx_id:%s, %j',
                GET_NOTIFICATIONS,
                tx_id,
                error
              )
            );
            return getNotiError({ tx_id, error: error.message });
          })
      )
    )
  );
