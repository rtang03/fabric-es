import { assign } from 'lodash';
import { ofType } from 'redux-observable';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { getNetwork, submit$, submitPrivateData$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { CreateAction } from '../types';

export default (action$: Observable<CreateAction>, _, context) =>
  action$.pipe(
    ofType(action.CREATE),
    map(({ payload }) => payload),
    // create epic is different from other command side epic. It is using enrollmentId, given by payload
    // to submit transaction, so that the submission is based individual x509 cert. This is used for
    // policy engine inside chaincode.
    // the other epic requires no further authorization check, and therefore, submit or evaluate
    // transaction using 'admin' account.
    mergeMap(payload =>
      from(
        getNetwork({
          enrollmentId: payload.enrollmentId
        })
          .then(({ network, gateway }) =>
            assign({}, payload, { network, gateway })
          )
          .catch(error => assign({}, payload, { error }))
      )
    ),
    mergeMap((getNetwork: any) => {
      if (getNetwork.error)
        return of(
          action.createError({
            tx_id: getNetwork.tx_id,
            error: getNetwork.error
          })
        );
      else {
        const { tx_id, args, network, gateway } = getNetwork;
        const { id, entityName, events, version, collection } = args;
        return collection
          ? submitPrivateData$(
              'privatedata:createCommit',
              [collection, entityName, id, version.toString()],
              { eventstr: Buffer.from(JSON.stringify(events)) },
              { network: network || context.network }
            ).pipe(
              tap(() => gateway.disconnect()),
              dispatchResult(tx_id, action.createSuccess, action.createError)
            )
          : submit$(
              'createCommit',
              [entityName, id, version.toString(), JSON.stringify(events)],
              { network: network || context.network }
            ).pipe(
              tap(() => gateway.disconnect()),
              dispatchResult(tx_id, action.createSuccess, action.createError)
            );
      }
    })
  );
