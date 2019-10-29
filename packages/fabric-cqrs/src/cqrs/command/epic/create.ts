import { assign } from 'lodash';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { getNetwork, submit$, submitPrivateData$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { CreateAction } from '../types';

export default (action$: Observable<CreateAction>, _, context) =>
  action$.pipe(
    ofType(action.CREATE),
    map(({ payload }) => payload),
    mergeMap(payload =>
      from(
        getNetwork({ enrollmentId: payload.enrollmentId }).then(
          ({ network, gateway }) => assign({}, payload, { network, gateway })
        )
      )
    ),
    mergeMap(
      ({
        tx_id,
        args: { id, entityName, events, version, collection },
        network,
        gateway
      }) =>
        collection
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
            )
    )
  );
