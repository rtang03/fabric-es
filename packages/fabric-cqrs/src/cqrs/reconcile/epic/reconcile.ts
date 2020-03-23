/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { action as command } from '../../command/action';
import { action } from '../action';
import { ReconcileAction } from '../types';

export default (action$: Observable<ReconcileAction>, _) => {
  const logger = Client.getLogger('reconcile.js');

  return action$.pipe(
    ofType(action.RECONCILE),
    map(({ payload }) => payload),
    mergeMap(
      ({ tx_id, args: { entityName, reducer }, store, channelEventHub, channelName, connectionProfile, wallet }) =>
        from(
          new Promise<any>(resolve => {
            const unsubscribe = store.subscribe(() => {
              const state = store.getState().write;
              const tid = state.tx_id;
              const { type, result } = state;

              if (tx_id === tid && type === command.QUERY_SUCCESS) {
                logger.info(command.QUERY_SUCCESS);
                logger.debug(util.format('tx_id: %s, type: %s', tid, command.QUERY_SUCCESS));

                unsubscribe();

                resolve(
                  action.merge({
                    tx_id,
                    args: { entityName, commits: result, reducer },
                    store
                  })
                );
              }
            });

            store.dispatch(
              command.queryByEntityName({
                tx_id,
                args: { entityName },
                channelName,
                channelEventHub,
                connectionProfile,
                wallet
              }) as any
            );

            logger.info(`dispatch ${command.QUERY_BY_ENTITY_NAME}: ${tx_id}`);
          })
        )
    )
  );
};
