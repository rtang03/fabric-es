import util from 'util';
import { Utils } from 'fabric-common';
import { Contract, ContractListener, Network } from 'fabric-network';
import { action } from '../cqrs/query';
import { generateToken } from '../cqrs/utils';
// import { channelEventHub } from '../services';
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

  let contractListener: ContractListener;
  let contract: Contract;
  let network: Network;

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
      logger.info('subscribe channel event hub');
      network = await gateway.getNetwork(channelName);
      contract = network.getContract('eventstore');
      contractListener = network.getContract('eventstore').addContractListener(
        ({ chaincodeId, payload, eventName }) => {
          const tid = generateToken();
          logger.info('subscribed event arrives');

          const commit = JSON.parse(payload.toString('utf8'));

          store.dispatch(action.merge({ tx_id: tid, args: { commit } }));
        },
        { type: 'full' }
      );
      // registerId = await channelEventHub(channelHub).registerCCEvent({
      //   onChannelEventArrived: ({ commit }) => {
      //     const tid = generateToken();
      //     logger.info('subscribed event arrives');
      //     logger.debug(util.format('subscribed event arrives, %j', commit));
      //
      //     store.dispatch(action.merge({ tx_id: tid, args: { commit } }));
      //   }
      // });
    },
    unsubscribeHub: () => {
      contract.removeContractListener(contractListener);
      // channelHub.unregisterChaincodeEvent(registerId, true);
    },
    disconnect: () => gateway.disconnect()
  };
};
