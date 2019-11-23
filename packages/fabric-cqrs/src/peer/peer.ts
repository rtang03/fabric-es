import { createProjectionDb, createQueryDatabase } from '.';
import { action } from '../cqrs/query';
import { generateToken } from '../cqrs/utils';
import { channelEventHub } from '../services';
import { getStore } from '../store';
import { Peer, PeerOptions } from '../types';
import { ngacRepo, privateDataRepo, reconcile, repository } from './utils';

export const createPeer: (options: PeerOptions) => Peer = options => {
  let registerId: any;
  const {
    defaultEntityName,
    channelHub,
    gateway,
    projectionDb,
    queryDatabase,
    collection
  } = options;
  if (!collection) {
    console.error('null privatedata collection');
    throw new Error('Null privatedata collection');
  }
  options.projectionDb = projectionDb || createProjectionDb(defaultEntityName);
  options.queryDatabase = queryDatabase || createQueryDatabase();
  const store = getStore(options);
  return {
    getNgacRepo: ngacRepo(options.network),
    getPrivateDataRepo: privateDataRepo(store, collection),
    getRepository: repository(store),
    reconcile: reconcile(store),
    subscribeHub: async () => {
      registerId = await channelEventHub(channelHub).registerCCEvent({
        onChannelEventArrived: ({ commit }) => {
          const tid = generateToken();
          console.log('subscribed event arrives');
          store.dispatch(action.merge({ tx_id: tid, args: { commit } }));
        }
      });
    },
    unsubscribeHub: () => channelHub.unregisterChaincodeEvent(registerId, true),
    disconnect: () => gateway.disconnect()
  };
};
