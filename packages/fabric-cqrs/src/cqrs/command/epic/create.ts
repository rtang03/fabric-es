/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { Utils } from 'fabric-common';
import { assign } from 'lodash';
import { ofType } from 'redux-observable';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { getNetwork, submit$, submitPrivateData$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { CreateAction } from '../types';

export default (action$: Observable<CreateAction>, _, context) => {
  const logger = Utils.getLogger('[fabric-cqrs] create.js');

  return action$.pipe(
    ofType(action.CREATE),
    map(({ payload }) => payload),
    mergeMap(payload =>
      from(
        getNetwork({
          channelName: payload.channelName,
          connectionProfile: payload.connectionProfile,
          wallet: payload.wallet,
          enrollmentId: payload.enrollmentId
        })
          .then(({ network, gateway }) => {
            logger.info('getNetwork succeed');
            return assign({}, payload, { network, gateway });
          })
          .catch(error => {
            logger.error(util.format('getNework error: %s', error.message));
            return assign({}, payload, { error });
          })
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
        const { id, entityName, events, version, isPrivateData } = args;

        return isPrivateData
          ? submitPrivateData$(
              'privatedata:createCommit',
              [entityName, id, version.toString()],
              { eventstr: Buffer.from(JSON.stringify(events)) },
              { network: network || context.network }
            ).pipe(
              tap(commits => {
                logger.debug(util.format('dispatch submitPrivateData response: %j', commits));
                gateway.disconnect();
              }),
              dispatchResult(tx_id, action.createSuccess, action.createError)
            )
          : submit$('eventstore:createCommit', [entityName, id, version.toString(), JSON.stringify(events)], {
              network: network || context.network
            }).pipe(
              tap(commits => {
                logger.debug(util.format('dispatch submit response: %j', commits));
                gateway.disconnect();
              }),
              dispatchResult(tx_id, action.createSuccess, action.createError)
            );
      }
    })
  );
};
