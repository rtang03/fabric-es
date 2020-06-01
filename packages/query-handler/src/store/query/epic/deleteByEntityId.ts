import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import { QueryDatabase } from '../../../types';
import { action } from '../action';
import type { DeleteByEntityIdAction } from '../types';

const { DELETE_BY_ENTITY_ID, deleteError, deleteSuccess } = action;

export default (
  action$: Observable<DeleteByEntityIdAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabase; logger: Logger }
) =>
  action$.pipe(
    ofType(DELETE_BY_ENTITY_ID),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, id } }) =>
      from(
        queryDatabase
          .deleteCommitByEntityId({ entityName, id })
          .then(({ result }) => deleteSuccess({ tx_id, result }))
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/deleteByEntityId.js] fail to %s: %j',
                DELETE_BY_ENTITY_ID,
                error
              )
            );
            return deleteError({ tx_id, error: error.message });
          })
      )
    )
  );
