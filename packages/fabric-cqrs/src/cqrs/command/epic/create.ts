/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { Utils } from 'fabric-common';
import { assign, isEmpty } from 'lodash';
import { ofType } from 'redux-observable';
import { concat, EMPTY, from, iif, Observable, of } from 'rxjs';
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
      const networks = [];
      payload.args.shouldTrack = (typeof payload.args.parentName !== 'undefined');
      console.log('MAMAMA 1', payload);

      if (!payload.args.isPrivateData || payload.args.shouldTrack) {
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
            return assign({}, payload, { private: false }, { network, gateway });
          }).catch(error => {
            logger.error(util.format('getNework error: %s', error.message));
            return assign({}, payload, { error });
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
            return assign({}, payload, { private: true }, { network, gateway });
          }).catch(error => {
            logger.error(util.format('getNework error: %s', error.message));
            return assign({}, payload, { error });
          })
        );
      }

      console.log('MAMAMA 2', networks.length);
      return from(Promise.all(networks));
    }),
    mergeMap((networks: any) => {
      const getNetwork = networks.reduce((accu, curr) => {
        if (curr.error) {
          if (curr.private)
            accu.errPrv = curr.error;
          else
            accu.errPub = curr.error;
        }
        if (curr.network) {
          if (curr.private)
            accu.netPrv = curr.network;
          else
            accu.netPub = curr.network;
        }
        if (curr.gateway) {
          if (curr.private)
            accu.gatePrv = curr.gateway;
          else
            accu.gatePub = curr.gateway;
        }
        if (curr.tx_id && !accu.tx_id) accu.tx_id = curr.tx_id;
        if (curr.args && !accu.args) accu.args = curr.args;
        return accu;
      }, {});
      console.log('MAMAMA 3', getNetwork);

      if (!getNetwork || isEmpty(getNetwork)) {
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
        if (getNetwork.args.isPrivateData) {
          return concat(
            submitPrivateData$('privatedata:createCommit',
              [getNetwork.args.entityName, getNetwork.args.id, getNetwork.args.version.toString()],
              { eventstr: Buffer.from(JSON.stringify(getNetwork.args.events)) },
              { network: getNetwork.netPrv || context.network }
            ),
            iif(() => getNetwork.args.shouldTrack,
              submit$('eventstore:createCommit', [
                  getNetwork.args.parentName,
                  getNetwork.args.id,
                  getNetwork.args.version.toString(),
                  JSON.stringify([{ type: 'PrivateDataUpdated', payload: { id: getNetwork.args.id }}])
                ],
                { network: getNetwork.netPub || context.network }
              ),
            )
          ).pipe(
            tap(commits => {
              logger.info(util.format('dispatch submitPrivateData response: %j', commits));
              if (getNetwork.gatePub) getNetwork.gatePub.disconnect();
              if (getNetwork.gatePrv) getNetwork.gatePrv.disconnect();
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
                getNetwork.gatePub.disconnect();
              }),
              dispatchResult(getNetwork.tx_id, action.createSuccess, action.createError)
            );
        }
      }
    })
  );
};
