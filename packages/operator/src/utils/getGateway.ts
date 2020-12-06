import util from 'util';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  Wallet,
} from 'fabric-network';
import yaml from 'js-yaml';
import { getLogger } from './getLogger';
import { promiseToReadFile } from './promiseToReadFile';

export const getGateway: (option: {
  connectionProfile: string;
  identity: string;
  asLocalhost: boolean;
  wallet: Wallet;
}) => Promise<Gateway> = async (option) => {
  const logger = getLogger({ name: '[operator] getGateway.js' });
  const { connectionProfile, identity, asLocalhost, wallet } = option;

  // use the loaded connection profile
  const gateway = new Gateway();
  try {
    const connection = await promiseToReadFile(connectionProfile);
    const ccp = yaml.safeLoad(connection) as object;
    await gateway.connect(ccp, {
      identity,
      wallet,
      eventHandlerOptions: { strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX },
      queryHandlerOptions: { strategy: DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE },
      discovery: { asLocalhost, enabled: true },
    });
  } catch (e) {
    logger.error(util.format('fail to connect gateway, %j', e));
    throw new Error(e);
  }
  logger.info(util.format('gateway connected: %s'));

  return gateway;
};
