import util from 'util';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  Network,
  Wallet,
} from 'fabric-network';
import { safeLoad } from 'js-yaml';
import { getLogger, promiseToReadFile } from '../utils';

/**
 * @about get network services
 * Special Notes:
 * 1. *asLocalhost* is used only for running with docker-compose
 * 1. *discovery* is used for on chain / public data only
 * @params option
 * @returns ```typescript
 * {
 *   enrollmentId: string;
 *   network: Network;
 *   gateway: Gateway;
 * }
 * ```
 */
export const getNetwork: (option: {
  enrollmentId: string;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
  eventHandlerStrategy?: any;
  queryHandlerStrategy?: any;
  asLocalhost: boolean;
  discovery: boolean;
}) => Promise<{
  enrollmentId: string;
  network: Network;
  gateway: Gateway;
}> = async ({
              enrollmentId,
              channelName,
              connectionProfile,
              wallet,
              eventHandlerStrategy = DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX,
              queryHandlerStrategy = DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE,
              discovery,
              asLocalhost,
            }) => {
  const logger = getLogger({ name: '[fabric-cqrs] getNetwork.js' });
  let identityExist;
  try {
    identityExist = await wallet.get(enrollmentId);
  } catch (e) {
    logger.error(util.format('error in wallet, %j', e));
    throw new Error(e);
  }
  if (!identityExist) {
    logger.error('no enrollmentId in the wallet');
    throw new Error('Please register user, before retrying');
  }
  if (!connectionProfile) {
    logger.error('no connection profile provided');
    throw new Error('No connection profile provided');
  }
  const gateway = new Gateway();
  let network: Network;
  let cp: string;

  try {
    cp = await promiseToReadFile(connectionProfile);
  } catch (err) {
    logger.error(util.format('new gateway error: %j', err));
    throw new Error(err);
  }

  const connect = (identity: string) =>
    gateway.connect(safeLoad(cp) as any, {
      identity,
      wallet,
      discovery: { enabled: discovery, asLocalhost },
      eventHandlerOptions: { strategy: eventHandlerStrategy },
      queryHandlerOptions: { strategy: queryHandlerStrategy },
    });

  try {
    await connect(enrollmentId);
  } catch (err) {
    logger.error(util.format('%s connect gateway error: %j', enrollmentId, err));
    throw new Error(err);
  }
  try {
    network = await gateway.getNetwork(channelName);
  } catch (err) {
    logger.error(util.format('%s getNetwork error: %j', channelName, err));
    throw new Error(err);
  }

  logger.debug(util.format('gateway connected: %s', enrollmentId));

  return { enrollmentId, gateway, network };
};
