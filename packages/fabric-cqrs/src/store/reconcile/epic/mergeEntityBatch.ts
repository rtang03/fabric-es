import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import { Commit } from '../../../types';
import { action as projAction } from '../../projection';
import { action } from '../action';
import type { MergeEntityBatchAction } from '../types';
import { dispatcher } from '../../../utils';

const { MERGE_ENTITY_BATCH, reconcileSuccess, reconcileError } = action;

export default (action$: Observable<MergeEntityBatchAction>, _, { logger }: { logger: Logger }) =>
  action$.pipe(
    ofType(MERGE_ENTITY_BATCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits }, store }) =>
      from(
        dispatcher<
          { key: string; status: string }[],
          { entityName: string; commits: Record<string, Commit> }
        >((payload) => projAction.mergeEntityBatch(payload), {
          SuccessAction: projAction.MERGE_ENTITY_BATCH_SUCCESS,
          ErrorAction: projAction.MERGE_ENTITY_BATCH_ERROR,
          logger,
          name: 'merge_entity_batch',
          slice: 'projection',
          store,
        })({ entityName, commits })
          .then(({ status, data, error }) =>
            status === 'OK'
              ? reconcileSuccess({ tx_id, result: data })
              : reconcileError({ tx_id, error })
          )
          .catch((error) => {
            logger.error(
              util.format(
                '[store/reconcile/mergeEntityBatch.js] fail to %s: %j',
                projAction.MERGE_ENTITY_BATCH,
                error
              )
            );
            return reconcileError({ tx_id, error: error.message });
          })
      )
    )
  );
