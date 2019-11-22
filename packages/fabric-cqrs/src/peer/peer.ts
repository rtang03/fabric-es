import { projectionDb as projDB, queryDatabase as queryDb } from '.';
import { action } from '../cqrs/query';
import { generateToken } from '../cqrs/utils';
import { channelEventHub } from '../services';
import { getStore } from '../store';
import { Option, Peer } from '../types';
import { ngacRepo, privateDataRepo, reconcile, repository } from './utils';

export const createPeer: (option: Option) => Peer = option => {
  let registerId: any;
  const {
    defaultEntityName,
    channelHub,
    gateway,
    projectionDb,
    queryDatabase,
    collection
  } = option;
  if (!collection) {
    console.error('null privatedata collection');
    throw new Error('Null privatedata collection');
  }
  option.projectionDb = projectionDb || projDB(defaultEntityName);
  option.queryDatabase = queryDatabase || queryDb();
  const store = getStore(option);
  return {
    getNgacRepo: ngacRepo(option.network),
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
