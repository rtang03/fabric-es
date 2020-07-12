import * as util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../../../types';
import { action } from '../action';
import type { NotifyAction } from '../types';

const { NOTIFY, notifySuccess, notifyError } = action;

export default (
  action$: Observable<NotifyAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabase; logger: Logger }
) =>
  action$.pipe(
    ofType(NOTIFY),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { creator, entityName, commitId, expireNow, id } }) =>
      from(
        queryDatabase
          .getNotification({ creator, entityName, commitId, expireNow, id })
          .then(({ result }) => notifySuccess({ tx_id, result }))
          .catch((error) => {
            logger.error(
              util.format('[store/query/notify.js] fail to %s: tx_id:%s, %j', NOTIFY, tx_id, error)
            );
            return notifyError({ tx_id, error: error.message });
          })
      )
    )
  );
