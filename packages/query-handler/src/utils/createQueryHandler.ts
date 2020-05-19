import util from 'util';
import { generateToken, isCommit } from '@fabric-es/fabric-cqrs';
import { Utils } from 'fabric-common';
import { Contract, ContractListener, Network, Gateway, Wallet } from 'fabric-network';
import { getStore } from '../store';
import { action } from '../store/query';
import { ProjectionDatabase, QueryDatabase } from '../types';

interface QueryHandlerOptions {
  queryDatabase: QueryDatabase;
  projectionDatabase: ProjectionDatabase;
  gateway: Gateway;
  channelName: string;
  wallet: Wallet;
  connectionProfile: string;
}

interface QueryHandler {
  getRepository: () => any;
  reconcile: () => void;
  subscribeHub: () => void;
  unsubscribeHub: () => void;
  disconnect: () => void;
}

export const createQueryHandler: (option: QueryHandlerOptions) => QueryHandler = options => {
  let contractListener: ContractListener;
  let contract: Contract;
  let network: Network;

  const { gateway, projectionDatabase, queryDatabase, channelName, wallet, connectionProfile } = options;
  const logger = Utils.getLogger('[fabric-cqrs] createPeer.js');
  const store = getStore(null);

  return {
    getRepository: null,
    reconcile: null,
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
