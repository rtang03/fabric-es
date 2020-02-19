import Client from 'fabric-client';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  Network
} from 'fabric-network';
import util from 'util';
import {
  Commit,
  CreateNetworkOperatorOption,
  MISSING_CHAINCODE_ID,
  MISSING_FCN,
  MISSING_WALLET_LABEL
} from '../types';
import { createCommitId } from '../utils';

export const submitOrEvaluateTx = (
  option: CreateNetworkOperatorOption
) => async ({
  identity,
  chaincodeId,
  fcn,
  args = [],
  eventHandlerStrategies = DefaultEventHandlerStrategies.MSPID_SCOPE_ALLFORTX,
  queryHandlerStrategies = DefaultQueryHandlerStrategies.MSPID_SCOPE_SINGLE,
  asLocalhost = true
}: {
  identity: string;
  chaincodeId: string;
  fcn: string;
  args?: string[];
  eventHandlerStrategies?: any;
  queryHandlerStrategies?: any;
  asLocalhost: boolean;
}): Promise<{
  disconnect: () => void;
  evaluate: () => Promise<Record<string, Commit> | { error: any }>;
  submit: () => Promise<Record<string, Commit> | { error: any }>;
}> => {
  const logger = Client.getLogger('submitOrEvaluateTx.js');

  if (!identity) throw new Error(MISSING_WALLET_LABEL);
  if (!chaincodeId) throw new Error(MISSING_CHAINCODE_ID);
  if (!fcn) throw new Error(MISSING_FCN);

  const { channelName, fabricNetwork, connectionProfile, wallet } = option;
  const gateway = new Gateway();

  try {
    await gateway.connect(connectionProfile, {
      identity,
      wallet,
      eventHandlerOptions: { strategy: eventHandlerStrategies },
      queryHandlerOptions: { strategy: queryHandlerStrategies },
      discovery: { asLocalhost, enabled: true }
    });
  } catch (e) {
    logger.error(util.format('fail to connect gateway, %j', e));
    throw new Error(e);
  }

  let network: Network;

  try {
    network = await gateway.getNetwork(channelName);
  } catch (e) {
    logger.error(util.format('fail to getNetwork, %j', e));
    throw new Error(e);
  }

  logger.info('gateway connected');

  return {
    disconnect: () => gateway.disconnect(),
    evaluate: () =>
      network
        .getContract(chaincodeId)
        .createTransaction(fcn)
        .evaluate(...args)
        .then<Record<string, Commit>>((res: any) => {
          logger.info(util.format('successfully evaluate tx: %s', fcn));
          return JSON.parse(Buffer.from(JSON.parse(res)).toString());
        })
        .catch(error => {
          logger.error(util.format('evaluate tx error in %s: %j', fcn, error));
          return { error };
        }),
    submit: () => {
      const input_args =
        fcn === 'createCommit' ? [...args, createCommitId()] : args;

      return network
        .getContract(chaincodeId)
        .createTransaction(fcn)
        .submit(...input_args)
        .then<Record<string, Commit>>((res: any) => {
          logger.info(util.format('successfully submit tx: %s', fcn));
          return JSON.parse(Buffer.from(JSON.parse(res)).toString());
        })
        .catch(error => {
          logger.error(util.format('submit tx error in %s: %j', fcn, error));
          return { error };
        });
    }
  };
};
