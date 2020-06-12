/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { Utils } from 'fabric-common';
import { ofType } from 'redux-observable';
import { from, Observable, of } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { getNetwork, submit$ } from '../../../services';
import { TRACK_EVENT } from '../../../types';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { TrackAction } from '../types';

export default (action$: Observable<TrackAction>, _, context): Observable<any> => {
  const logger = Utils.getLogger('[fabric-cqrs] track.js');

  return action$.pipe(
    ofType(action.TRACK),
    map(({ payload }) => payload),
    mergeMap(payload =>
      from(
        getNetwork({
          channelName: payload.channelName,
          connectionProfile: payload.connectionProfile,
          wallet: payload.wallet,
          enrollmentId: payload.enrollmentId,
          discovery: true,
          asLocalhost: !(process.env.NODE_ENV === 'production')
        }).then(({ network, gateway }) => {
            logger.info('getNetwork succeed');
            return Object.assign({}, payload, { network, gateway });
        }).catch(error => {
            logger.error(util.format('getNework error: %s', error.message));
            return Object.assign({}, payload, { error });
        })
      )),
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
        const params = [args.parentName, args.id, args.version.toString()];
        params.push(JSON.stringify([{ type: TRACK_EVENT, payload: { id: args.id }}]));

        return submit$('eventstore:createCommit', params, { network: network || context.network }).pipe(
          tap(commits => {
            logger.debug(util.format('dispatch submit response: %j', commits));
            gateway.disconnect();
          }), dispatchResult(tx_id, action.createSuccess, action.createError)
        );
      }
    })
  );
};