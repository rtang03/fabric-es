import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../../../queryHandler/types';
import { action } from '../action';
import type { GetNotificationAction } from '../types';

const { GET_NOTIFICATION, getNotiSuccess, getNotiError } = action;

export default (
  action$: Observable<GetNotificationAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabase; logger: Logger }
) =>
  action$.pipe(
    ofType(GET_NOTIFICATION),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { creator, entityName, commitId, id } }) =>
      from(
        queryDatabase
          .getNotification({ creator, entityName, commitId, id })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? getNotiSuccess({ tx_id, result: data })
              : getNotiError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/getNotification.js] fail to %s: tx_id:%s, %j',
                GET_NOTIFICATION,
                tx_id,
                error
              )
            );
            return getNotiError({ tx_id, error: error.message });
          })
      )
    )
  );
