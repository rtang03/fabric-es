import util from 'util';
import isEqual from 'lodash/isEqual';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import type { Logger } from 'winston';
import type { Commit } from '../../../types';
import { dispatcher } from '../../../utils';
import { action as commandAction } from '../../command/action';
import { action } from '../action';
import type { ReconcileAction } from '../types';

const { RECONCILE, mergeCommitBatch, reconcileError, reconcileSuccess } = action;

export default (action$: Observable<ReconcileAction>, _, { logger }: { logger: Logger }) =>
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
        const promise = !entityName
          ? Promise.resolve(reconcileError({ tx_id, error: 'invalid input argument' }))
          : dispatcher<Record<string, Commit>, { entityName: string; isPrivateData: boolean }>(
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
              .then(({ data: commits }) => {
                if (!commits || isEqual(commits, {}))
                  return reconcileSuccess({ tx_id, result: [] });

                const keys = Object.keys(commits);
                logger.debug(
                  util.format(
                    '[store/reconcile.js] %s commits are retrieved from Fabric: %j',
                    keys.length,
                    keys
                  )
                );
                return mergeCommitBatch({ tx_id, args: { entityName, commits }, store });
              })
              .catch((error) => {
                logger.error(
                  util.format(
                    '[store/reconcile.js] fail to %s: %j',
                    commandAction.QUERY_BY_ENTITY_NAME,
                    error
                  )
                );
                return reconcileError({ tx_id, error: error.message });
              });

        return from(promise);
      }
    )
  );
