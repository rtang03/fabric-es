/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { ofType } from 'redux-observable';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { getNetwork, submit$, submitPrivateData$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import type { CreateAction } from '../types';

const { CREATE, createSuccess, createError, track, trackSuccess, trackError } = action;

export default (action$: Observable<CreateAction>, _, context) =>
  action$.pipe(
    ofType(CREATE),
    map(({ payload }) => payload),
    mergeMap((payload) =>
      from(
        getNetwork({
          channelName: payload.channelName,
          connectionProfile: payload.connectionProfile,
          wallet: payload.wallet,
          enrollmentId: payload.enrollmentId,
          discovery: !payload.args.isPrivateData,
          asLocalhost: !(process.env.NODE_ENV === 'production'),
        })
          .then(({ network, gateway }) => Object.assign({}, { payload, network, gateway }))
          .catch((error) => {
            context.logger.error(
              util.format('[store/command/create.js] getNework error: %s', error.message)
            );
            return Object.assign({}, { ...payload, error });
          })
      )
    ),
    mergeMap((getNetwork: any) => {
      if (getNetwork.error) {
        return of(
          action.createError({
            tx_id: getNetwork.tx_id,
            error: getNetwork.error,
          })
        );
      } else {
        const { payload, network, gateway } = getNetwork;
        const { tx_id, args, enrollmentId, channelName, connectionProfile, wallet } = payload;
        const { id, entityName, parentName, version, isPrivateData } = args;
        const events = args?.events ? JSON.stringify(args?.events) : null;

        return isPrivateData
          ? submitPrivateData$(
              'privatedata:createCommit',
              [entityName, id, version.toString()],
              { eventstr: Buffer.from(events) },
              { network: network || context.network }
            ).pipe(
              tap(() => gateway.disconnect()),
              map((result: any) => {
                if (result.error) return createError({ tx_id, error: result.error });
                else if (result.status) {
                  if (result.status === 'ERROR') return createError({ tx_id, error: result });
                }

                return parentName
                  ? track({
                      channelName,
                      connectionProfile,
                      wallet,
                      tx_id,
                      enrollmentId,
                      args: { entityName, parentName, id, version: 0 },
                    })
                  : createSuccess({ tx_id, result });
              })
            )
          : submit$('eventstore:createCommit', [entityName, id, version.toString(), events], {
              network: network || context.network,
            }).pipe(
              tap(() => gateway.disconnect()),
              dispatchResult(tx_id, createSuccess, createError)
            );
      }
    })
  );
