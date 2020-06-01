import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import { dispatcher } from '../../../utils';
import { action as queryAction } from '../../query/action';
import { action } from '../action';
import type { MergeCommitBatchAction } from '../types';

const { MERGE_COMMIT_BATCH, reconcileError, mergeEntityBatch } = action;

export default (action$: Observable<MergeCommitBatchAction>, _, { logger }: { logger: Logger }) =>
  action$.pipe(
    ofType(MERGE_COMMIT_BATCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits }, store }) =>
      from(
        dispatcher<string[], { entityName: string; commits: Record<string, Commit> }>(
          (payload) => queryAction.mergeCommitBatch(payload),
          {
            SuccessAction: queryAction.MERGE_COMMIT_BATCH_SUCCESS,
            ErrorAction: queryAction.MERGE_COMMIT_BATCH_ERROR,
            logger,
            name: 'merge_commit_batch',
            slice: 'query',
            store,
          }
        )({ entityName, commits })
          .then(({ data }) => {
            logger.info(
              util.format(
                '[store/reconcile/mergeCommitBatch.js] %s commits are merged to QueryDatabase: %j',
                data.length,
                data
              )
            );
            return mergeEntityBatch({ tx_id, args: { commits, entityName } });
          })
          .catch((error) => {
            logger.error(
              util.format(
                '[store/reconcile/mergeCommitBatch.js] fail to %s: %j',
                queryAction.MERGE_COMMIT_BATCH,
                error
              )
            );
            return reconcileError({ tx_id, error: error.message });
          })
      )
    )
  );
