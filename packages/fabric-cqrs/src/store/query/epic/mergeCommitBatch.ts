import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { QueryDatabaseV2 } from '../../../queryHandlerV2/types';
import { action } from '../action';
import type { MergeBatchAction } from '../types';

const { MERGE_COMMIT_BATCH, mergeCommitBatchSuccess, mergeCommitBatchError } = action;

export default (
  action$: Observable<MergeBatchAction>,
  _,
  { queryDatabase, logger }: { queryDatabase: QueryDatabaseV2; logger: Logger }
) =>
  action$.pipe(
    ofType(MERGE_COMMIT_BATCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits } }) =>
      from(
        queryDatabase
          .mergeCommitBatch({ entityName, commits })
          .then(({ data, status, errors }) =>
            status === 'OK'
              ? mergeCommitBatchSuccess({ tx_id, result: data })
              : mergeCommitBatchError({ tx_id, error: errors })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/query/mergeCommitBatch.js] fail to %s: %j',
                MERGE_COMMIT_BATCH,
                error
              )
            );
            return mergeCommitBatchError({ tx_id, error: error.message });
          })
      )
    )
  );
