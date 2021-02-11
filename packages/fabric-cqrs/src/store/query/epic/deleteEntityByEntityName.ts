import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabaseV2 } from '../../../queryHandlerV2/types';
import { action } from '../action';
import type { DeleteEntityByEntityNameAction } from '../types';

const {
  DELETE_ENTITY_BY_ENTITYNAME,
  deleteEntityByEntityNameSuccess,
  deleteEntityByEntityNameError,
} = action;

export default (
  action$: Observable<DeleteEntityByEntityNameAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabaseV2; logger: Logger }
) =>
  action$.pipe(
    ofType(DELETE_ENTITY_BY_ENTITYNAME),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName } }) =>
      from(
        queryDatabase
          .deleteEntityByEntityName({ entityName })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? deleteEntityByEntityNameSuccess({ tx_id, result: data })
              : deleteEntityByEntityNameError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/deleteEntityByEntityName.js] fail to %s: %j',
                DELETE_ENTITY_BY_ENTITYNAME,
                error
              )
            );
            return deleteEntityByEntityNameError({ tx_id, error: error.message });
          })
      )
    )
  );
