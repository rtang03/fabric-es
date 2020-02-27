import util from 'util';
import Client from 'fabric-client';
import { action } from '../cqrs/query';
import { generateToken } from '../cqrs/utils';
import { channelEventHub } from '../services';
import { getStore } from '../store';
import { Peer, PeerOptions } from '../types';
import { ngacRepo, privateDataRepo, reconcile, repository } from './utils';
import { createProjectionDb, createQueryDatabase } from '.';

export const createPeer: (options: PeerOptions) => Peer = options => {
  const logger = Client.getLogger('createPeer.js');

  let registerId: any;
  const {
    defaultEntityName,
    channelHub,
    gateway,
    projectionDb,
    queryDatabase,
    collection,
    channelName,
    wallet,
    connectionProfile,
    channelEventHubUri
  } = options;

  if (!collection) {
    logger.error('null privatedata collection');
    throw new Error('Null privatedata collection');
  }
  options.projectionDb = projectionDb || createProjectionDb(defaultEntityName);
  options.queryDatabase = queryDatabase || createQueryDatabase();

  const store = getStore(options);

  return {
    getNgacRepo: ngacRepo(options.network),
    getPrivateDataRepo: privateDataRepo({
      store,
      collection,
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
