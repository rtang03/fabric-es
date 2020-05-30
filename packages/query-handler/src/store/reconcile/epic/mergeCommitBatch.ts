import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { dispatcher, getLogger } from '../../../utils';
import { action as queryAction } from '../../query/action';
import { action } from '../action';
import type { MergeCommitBatchAction } from '../types';

const { MERGE_COMMIT_BATCH, reconcileError, mergeEntityBatch } = action;

export default (action$: Observable<MergeCommitBatchAction>) =>
  action$.pipe(
    ofType(MERGE_COMMIT_BATCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits }, store }) => {
      const logger = getLogger({ name: '[query-handler] store/reconcile/mergeCommitBatch.js' });

      return from(
        dispatcher<string[], { entityName: string; commits: Record<string, Commit> }>(
          (payload) => queryAction.mergeBatch(payload),
          {
            SuccessAction: queryAction.MERGE_BATCH_SUCCESS,
            ErrorAction: queryAction.MERGE_BATCH_ERROR,
            logger,
            name: 'merge_commit_batch',
            slice: 'query',
            store,
          }
        )({ entityName, commits })
          .then(({ data }) => {
            logger.info(util.format('%s commits are merged: %j', data.length, data));
            return mergeEntityBatch({ tx_id, args: { commits, entityName } });
          })
          .catch((error) => reconcileError({ tx_id, error }))
      );
    })
  );
