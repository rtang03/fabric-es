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
import { TRACK_EVENT, TS_FIELD } from '../../../types';
import { addCreatedAt, replaceTag } from '../../../utils';
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
            logger.debug('getNetwork succeed');
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
        const currentTime = Math.round(new Date().getTime());
        const { tx_id, args, network, gateway } = getNetwork;
        const params = [args.parentName, args.id, args.version.toString()];
        const events = replaceTag(addCreatedAt([{
          type: TRACK_EVENT,
          payload: { id: args.id, entityName: args.entityName }
        }]));
        params.push(JSON.stringify(events));

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