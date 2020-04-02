import util from 'util';
import { Utils } from 'fabric-common';
import { Contract, ContractListener, Network } from 'fabric-network';
import { action } from '../cqrs/query';
import { generateToken } from '../cqrs/utils';
import { getStore } from '../store';
import { Peer, PeerOptions } from '../types';
import { isCommit, privateDataRepo, reconcile, repository } from './utils';
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

  const { defaultEntityName, gateway, projectionDb, queryDatabase, channelName, wallet, connectionProfile } = options;

  options.projectionDb = projectionDb || createProjectionDb(defaultEntityName);
  options.queryDatabase = queryDatabase || createQueryDatabase();

  const store = getStore(options);

  return {
    getPrivateDataRepo: privateDataRepo({
      store,
      channelName,
      wallet,
      connectionProfile
    }),
    getRepository: repository({
      store,
      channelName,
      wallet,
      connectionProfile,
    }),
    reconcile: reconcile({
      store,
      channelName,
      wallet,
      connectionProfile,
    }),
    subscribeHub: async () => {
      logger.info('subscribe channel event hub');
      network = await gateway.getNetwork(channelName);
      contract = network.getContract('eventstore');
      contractListener = network.getContract('eventstore').addContractListener(
        ({ chaincodeId, payload, eventName }) => {
          logger.info(`subscribed event arrives from ${chaincodeId}`);
          let commit: unknown;

          if (eventName !== 'createCommit') {
            logger.warn(`receive unexpected contract event: ${eventName}`);
            return;
          }

          try {
            commit = JSON.parse(payload.toString('utf8'));
          } catch (e) {
            logger.error(util.format('fail to parse contract event, %j', e));
            return;
          }

          if (isCommit(commit)) {
            store.dispatch(action.merge({ tx_id: generateToken(), args: { commit } }));
          } else logger.warn(util.format('receive contract events of unknown type, %j', commit));
        },
        { type: 'full' }
      );
    },
    unsubscribeHub: () => contract.removeContractListener(contractListener),
    disconnect: () => gateway.disconnect()
  };
};
