import util from 'util';
import { Utils } from 'fabric-common';
import { action } from '../cqrs/query';
import { generateToken } from '../cqrs/utils';
import { channelEventHub } from '../services';
import { getStore } from '../store';
import { Peer, PeerOptions } from '../types';
import { privateDataRepo, reconcile, repository } from './utils';
import { createProjectionDb, createQueryDatabase } from '.';

/**
 * **createPeer** creates Peer object for a specific Hyperledger peer node
 * @param options [[PeerOptions]]
 * @returns [[Peer]]
 */
export const createPeer: (options: PeerOptions) => Peer = options => {
  const logger = Utils.getLogger('[fabric-cqrs] createPeer.js');

  let registerId: any;
  const {
    defaultEntityName,
    channelHub,
    gateway,
    projectionDb,
    queryDatabase,
    channelName,
    wallet,
    connectionProfile,
    channelEventHubUri
  } = options;

  options.projectionDb = projectionDb || createProjectionDb(defaultEntityName);
  options.queryDatabase = queryDatabase || createQueryDatabase();

  const store = getStore(options);

  return {
    getPrivateDataRepo: privateDataRepo({
      store,
      channelName,
      wallet,
      connectionProfile,
      channelEventHub: channelEventHubUri
    }),
    getRepository: repository({
      store,
      channelName,
      wallet,
      connectionProfile,
      channelEventHub: channelEventHubUri
    }),
    reconcile: reconcile({
      store,
      channelName,
      wallet,
      connectionProfile,
      channelEventHub: channelEventHubUri
    }),
    subscribeHub: async () => {
      logger.info('subcribe channel event hub');

      registerId = await channelEventHub(channelHub).registerCCEvent({
        onChannelEventArrived: ({ commit }) => {
          const tid = generateToken();
          logger.info('subscribed event arrives');
          logger.debug(util.format('subscribed event arrives, %j', commit));

          store.dispatch(action.merge({ tx_id: tid, args: { commit } }));
        }
      });
    },
    unsubscribeHub: () => channelHub.unregisterChaincodeEvent(registerId, true),
    disconnect: () => gateway.disconnect()
  };
};
