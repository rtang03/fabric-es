import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabase } from '../../../types';
import { action } from '../action';
import type { EIdxSearchAction } from '../types';

const { EIDX_SEARCH, searchSuccess, searchError } = action;

export default (
  action$: Observable<EIdxSearchAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabase; logger: Logger }
) =>
  action$.pipe(
    ofType(EIDX_SEARCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { query, countTotalOnly } }) =>
      from(
        queryDatabase
          .fullTextSearchEntity({ query, countTotalOnly })
          .then(({ result }) => searchSuccess({ tx_id, result }))
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/fullTextSearchEIdx.js] fail to %s: tx_id:%s, %j',
                EIDX_SEARCH,
                tx_id,
                error
              )
            );
            return searchError({ tx_id, error: error.message });
          })
      )
    )
  );
