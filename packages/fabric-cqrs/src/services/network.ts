import { readFileSync } from 'fs';
import util from 'util';
import { ChannelEventHub } from 'fabric-client';
import Client from 'fabric-client';
import { DefaultEventHandlerStrategies, DefaultQueryHandlerStrategies, Gateway, Network, Wallet } from 'fabric-network';
import { safeLoad } from 'js-yaml';

/**
 * **getNetwork** return network services
 * @returns `{
 *   enrollmentId: string;
 *   network: Network;
 *   gateway: Gateway;
 *   channelHub?: ChannelEventHub;
 * }`
 */
export const getNetwork: (option: {
  enrollmentId: string;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
  channelEventHub: string;
  channelEventHubExisted?: boolean;
  eventHandlerStrategy?: any;
  queryHandlerStrategy?: any;
  asLocalhost?: boolean;
}) => Promise<{
  enrollmentId: string;
  network: Network;
  gateway: Gateway;
  channelHub?: ChannelEventHub;
}> = async ({
  enrollmentId,
  channelName,
  connectionProfile,
  wallet,
  channelEventHub,
  channelEventHubExisted,
  eventHandlerStrategy = DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX,
  queryHandlerStrategy = DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE,
  asLocalhost = true
}) => {
  const logger = Client.getLogger('getNetwork.js');

  const identityExist: boolean = await wallet.exists(enrollmentId);
  if (!identityExist) {
    logger.warn('no enrollmentId in the wallet');
    throw new Error('Please register user, before retrying');
  }
  if (!connectionProfile) {
    logger.warn('no connection profile provided');
    throw new Error('No connection profile provided');
  }
  if (!channelEventHub) {
    logger.warn('no channel event hub provided');
    throw new Error('No channel event hub provided');
  }

  let gateway: Gateway;

  try {
    gateway = new Gateway();
  } catch (err) {
    logger.error(util.format('new gateway error: %j', err));
    throw new Error(err);
  }

  const connect = (identity: string) =>
    gateway
      .connect(safeLoad(readFileSync(connectionProfile, 'utf8')), {
        identity,
        wallet,
        discovery: { enabled: false, asLocalhost },
        eventHandlerOptions: {
          strategy: eventHandlerStrategy
        },
        queryHandlerOptions: {
          strategy: queryHandlerStrategy
        }
      })
      .catch(error => {
        logger.error(util.format('cannot connect gateway, %j', error));
        throw error;
      });

  try {
    await connect(enrollmentId);
  } catch (err) {
    logger.error(util.format('%s connect gateway error: %j', enrollmentId, err));
    throw new Error(err);
  }

  let network;

  try {
    network = await gateway.getNetwork(channelName);
  } catch (err) {
    logger.error(util.format('%s getNetwork error: %j', channelName, err));
    throw new Error(err);
  }

  return channelEventHubExisted
    ? {
        enrollmentId,
        network,
        gateway,
        channelHub: network.getChannel().getChannelEventHub(channelEventHub)
      }
    : { enrollmentId, network, gateway };
};
