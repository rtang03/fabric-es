import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Logger } from 'winston';
import type { QueryDatabase } from '../../../types';
import { action } from '../action';
import { FindAction } from '../types';

const { FIND, findSuccess, findError } = action;

export default (
  action$: Observable<FindAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabase; logger: Logger }
) =>
  action$.pipe(
    ofType(action.FIND),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, byId, byDesc } }) => {
      let query = `@entname:${entityName} `;
      if (byId) query = `${query} @id:${byId}`;
      if (byDesc) query = `${query} @desc:${byDesc}`;

      return from(
        queryDatabase
          .fullTextSearchEntity({ query })
          .then(({ result }) => findSuccess({ tx_id, result }))
          .catch((error) => {
            logger.error(
              util.format('[store/query/find.js] fail to %s: tx_id:%s, %j', FIND, tx_id, error)
            );
            return findError({ tx_id, error: error.message });
          })
      );
    })
  );