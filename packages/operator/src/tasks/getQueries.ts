import util from 'util';
import { Channel } from 'fabric-common';
import { Gateway } from 'fabric-network';
import { CreateNetworkOperatorOption, Queries } from '../types';
import { getGateway, getLogger } from '../utils';

/**
 * @ignore
 * @param option
 */
export const getQueries: (
  option: CreateNetworkOperatorOption
) => (opt?: { asLocalhost?: boolean }) => Promise<Queries> = (option) => async (
  { asLocalhost } = { asLocalhost: true }
) => {
  let channel: Channel;
  let gateway: Gateway;

  const logger = getLogger({ name: '[operator] getQueries.js' });
  const {
    connectionProfile,
    channelName,
    mspId,
    wallet,
    caAdmin,
  } = option;

  // use the loaded connection profile
  try {
    gateway = await getGateway({
      connectionProfile,
      identity: caAdmin,
      wallet,
      asLocalhost,
    });
    const network = await gateway.getNetwork(channelName);
    channel = network.getChannel();
  } catch (e) {
    logger.error(util.format('fail to connect gateway, %j', e));
    throw new Error(e);
  }

  return {
    disconnect: () => gateway.disconnect(),
    getMspid: () => mspId,
  };
};
