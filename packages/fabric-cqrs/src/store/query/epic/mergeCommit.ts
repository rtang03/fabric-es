import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabaseV2 } from '../../../queryHandlerV2/types';
import { action } from '../action';
import type { MergeAction } from '../types';

const { MERGE_COMMIT, mergeCommitSuccess, mergeCommitError } = action;

export default (
  action$: Observable<MergeAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabaseV2; logger: Logger }
) =>
  action$.pipe(
    ofType(MERGE_COMMIT),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { commit } }) =>
      from(
        queryDatabase
          .mergeCommit({ commit })
          .then(({ data, status, errors }) =>
            status === 'OK'?
            mergeCommitSuccess({ tx_id, result: data }):
            mergeCommitError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/mergeCommit.js] fail to %s: tx_id:%s, %j',
                MERGE_COMMIT,
                tx_id,
                error
              )
            );
            return mergeCommitError({ tx_id, error: error.message });
          })
      )
    )
  );
