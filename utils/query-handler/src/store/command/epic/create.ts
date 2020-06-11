import util from 'util';
import { dispatchResult, getNetwork, submit$, submitPrivateData$ } from '@fabric-es/fabric-cqrs';
import { assign } from 'lodash';
import { ofType } from 'redux-observable';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { action } from '../action';
import { CreateAction } from '../../../../../../deployments/dev-net/types';

const { CREATE, createSuccess, createError } = action;

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
          .then(({ network, gateway }) => assign({}, payload, { network, gateway }))
          .catch((error) => {
            context.logger.error(
              util.format('[store/command/create.js] getNework error: %s', error.message)
            );
            return assign({}, payload, { error });
          })
      )
    ),
    mergeMap((getNetwork: any) => {
      if (getNetwork.error)
        return of(
          action.createError({
            tx_id: getNetwork.tx_id,
            error: getNetwork.error,
          })
        );
      else {
        const { tx_id, args, network, gateway } = getNetwork;
        const { id, entityName, events, version, isPrivateData } = args;

        return isPrivateData
          ? submitPrivateData$(
              'privatedata:createCommit',
              [entityName, id, version.toString()],
              { eventstr: Buffer.from(JSON.stringify(events)) },
              { network: network || context.network }
            ).pipe(
              tap(() => gateway.disconnect()),
              dispatchResult(tx_id, createSuccess, createError)
            )
          : submit$(
              'eventstore:createCommit',
              [entityName, id, version.toString(), JSON.stringify(events)],
              {
                network: network || context.network,
              }
            ).pipe(
              tap(() => gateway.disconnect()),
              dispatchResult(tx_id, createSuccess, createError)
            );
      }
    })
  );
