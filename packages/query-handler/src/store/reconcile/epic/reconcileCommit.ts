import { Commit } from '@fabric-es/fabric-cqrs';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { dispatcher, getLogger } from '../../../utils';
import { action as commandAction } from '../../command/action';
import { action } from '../action';
import type { ReconcileAction } from '../types';

const { RECONCILE, mergeCommitBatch, reconcileError } = action;

export default (action$: Observable<ReconcileAction>, _) =>
  action$.pipe(
    ofType(RECONCILE),
    map(({ payload }) => payload),
    mergeMap(
      ({
        tx_id,
        args: { entityName },
        store,
        channelEventHub,
        channelName,
        connectionProfile,
        wallet,
      }) => {
        const logger = getLogger({ name: '[query-handler] store/reconcile/reconcile.js' });

        return from(
          dispatcher<Record<string, Commit>, { entityName: string; isPrivateData: boolean }>(
            (payload) =>
              commandAction.queryByEntityName({
                ...payload,
                channelName,
                connectionProfile,
                wallet,
              }),
            {
              SuccessAction: commandAction.QUERY_SUCCESS,
              ErrorAction: commandAction.QUERY_ERROR,
              logger,
              name: 'reconcile',
              store,
              slice: 'write',
            }
          )({ entityName, isPrivateData: false })
            .then(({ data: commits }) =>
              mergeCommitBatch({ tx_id, args: { entityName, commits }, store })
            )
            .catch((error) => reconcileError({ tx_id, error }))
        );
      }
    )
  );
