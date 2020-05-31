import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { dispatcher, getLogger } from '../../../utils';
import { action as projAction } from '../../projection';
import { action } from '../action';
import type { MergeEntityBatchAction } from '../types';

const { MERGE_ENTITY_BATCH, reconcileSuccess, reconcileError } = action;

export default (action$: Observable<MergeEntityBatchAction>) =>
  action$.pipe(
    ofType(MERGE_ENTITY_BATCH),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits }, store }) => {
      const logger = getLogger({ name: '[query-handler] store/reconcile/mergeEntityBatch.js' });

      return from(
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
          .then(({ data }) => reconcileSuccess({ tx_id, result: data }))
          .catch((error) => {
            logger.warn(util.format('fail to %s: %j', projAction.MERGE_ENTITY_BATCH, error));
            return reconcileError({ tx_id, error });
          })
      );
    })
  );
