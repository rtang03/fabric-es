import { Commit } from '@fabric-es/fabric-cqrs';
import { Utils } from 'fabric-common';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { dispatcher } from '../../../utils';
import { action as command } from '../../command/action';
import { action } from '../action';
import { ReconcileAction } from '../types';

export default (action$: Observable<ReconcileAction>, _) =>
  action$.pipe(
    ofType(action.RECONCILE),
    map(({ payload }) => payload),
    mergeMap(
      ({ tx_id, args: { entityName, reducer }, store, channelEventHub, channelName, connectionProfile, wallet }) =>
        from(
          dispatcher<Record<string, Commit>, { entityName: string; isPrivateData: boolean }>(
            (payload) => command.queryByEntityName({ ...payload, channelName, connectionProfile, wallet }),
            {
              SuccessAction: command.QUERY_SUCCESS,
              ErrorAction: command.QUERY_ERROR,
              logger: Utils.getLogger('[query-handler] reconcile.js'),
              name: 'reconcile',
              store,
              slice: 'write',
            }
          )({ entityName, isPrivateData: false }).then(({ data: commits }) =>
            action.merge({ tx_id, args: { entityName, commits, reducer }, store })
          )
        )
    )
  );
