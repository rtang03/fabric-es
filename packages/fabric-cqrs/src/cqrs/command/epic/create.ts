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
    mergeMap(payload => {
      const shouldTrack = (payload.args.entityName === 'docContents'); // TODO TEMP!!!!!!!!!!!!!!!!!!!!!!!!!
      const networks = [];

      if (!payload.args.isPrivateData || shouldTrack) {
        networks.push(
          getNetwork({
            channelName: payload.channelName,
            connectionProfile: payload.connectionProfile,
            wallet: payload.wallet,
            enrollmentId: payload.enrollmentId,
            discovery: true, // !payload.args.isPrivateData,
            asLocalhost: !(process.env.NODE_ENV === 'production')
          }).then(({ network, gateway }) => {
            logger.info('getNetwork succeed');
            return assign({}, payload, { shouldTrack, parentEntity: 'document' }, { netPub: network, gateway });
          }).catch(error => {
            logger.error(util.format('getNework error: %s', error.message));
            return assign({}, payload, { errPub: error });
          })
        );
      }

      if (payload.args.isPrivateData) {
        networks.push(
          getNetwork({
            channelName: payload.channelName,
            connectionProfile: payload.connectionProfile,
            wallet: payload.wallet,
            enrollmentId: payload.enrollmentId,
            discovery: false,
            asLocalhost: !(process.env.NODE_ENV === 'production')
          }).then(({ network, gateway }) => {
            logger.info('getNetwork succeed');
            return assign({}, payload, { shouldTrack, parentEntity: 'document' }, { netPrv: network, gateway });
          }).catch(error => {
            logger.error(util.format('getNework error: %s', error.message));
            return assign({}, payload, { errPrv: error });
          })
        );
      }

      console.log('OHOHOHOHOHOHOHOHOHOHOHOH', networks.length);
      return from(Promise.all(networks));
    }),
    mergeMap((networks: any) => {
      const getNetwork = (networks.length > 0) ? networks[0] : undefined;

      if (!getNetwork) {
        return of(
          action.createError({
            tx_id: getNetwork.tx_id,
            error: 'Unknown error'
          })
        );
      } else if (getNetwork.errPrv) {
        return of(
          action.createError({
            tx_id: getNetwork.tx_id,
            error: getNetwork.errPrv
          })
        );
      } else if (getNetwork.errPub) {
        return of(
          action.createError({
            tx_id: getNetwork.tx_id,
            error: getNetwork.errPub
          })
        );
      } else {
        // const { tx_id, args, network, gateway } = getNetwork;
        // const { id, entityName, events, version, isPrivateData } = args;
        console.log('LOLOLOLOLOLOLOLOLOLOLOLO', getNetwork);
        console.log('MOMOMOMOMOMOMOMOMOMOMOMO', getNetwork.parentEntity, JSON.stringify(getNetwork.args));
        console.log('HOHOHOHOHOHOHOHOHOHOHOHO', JSON.stringify(getNetwork.args.events));

        if (getNetwork.args.isPrivateData) {
          if (getNetwork.shouldTrack) {
            const track = [{ type: 'PrivateDataUpdated', payload: { id: getNetwork.args.id }}];
            submit$('eventstore:createCommit',
              [getNetwork.parentEntity, getNetwork.args.id, getNetwork.args.version.toString(), JSON.stringify(track)],
              { network: getNetwork.netPub || context.network }
            );
          }

          return submitPrivateData$('privatedata:createCommit',
              [getNetwork.args.entityName, getNetwork.args.id, getNetwork.args.version.toString()],
              { eventstr: Buffer.from(JSON.stringify(getNetwork.args.events)) },
              { network: getNetwork.netPrv || context.network }
            ).pipe(
              tap(commits => {
                logger.debug(util.format('dispatch submitPrivateData response: %j', commits));
                getNetwork.gateway.disconnect();
              }),
              dispatchResult(getNetwork.tx_id, action.createSuccess, action.createError)
            );
        } else {
          return submit$('eventstore:createCommit',
              [getNetwork.args.entityName, getNetwork.args.id, getNetwork.args.version.toString(), JSON.stringify(getNetwork.args.events)],
              { network: getNetwork.netPub || context.network }
            ).pipe(
              tap(commits => {
                logger.debug(util.format('dispatch submit response: %j', commits));
                getNetwork.gateway.disconnect();
              }),
              dispatchResult(getNetwork.tx_id, action.createSuccess, action.createError)
            );
        }
      }
    })
  );
};
