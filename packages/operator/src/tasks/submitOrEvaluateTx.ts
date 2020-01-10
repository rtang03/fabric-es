import { Commit } from '@espresso/fabric-cqrs';
import Client from 'fabric-client';
import {
  DefaultEventHandlerStrategies,
  DefaultQueryHandlerStrategies,
  Gateway,
  Network
} from 'fabric-network';
import util from 'util';
import {
  CreateNetworkOperatorOption,
  MISSING_CHAINCODE_ID,
  MISSING_FCN,
  MISSING_WALLET_LABEL
} from '../types';

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
  if (!identity) throw new Error(MISSING_WALLET_LABEL);
  if (!chaincodeId) throw new Error(MISSING_CHAINCODE_ID);
  if (!fcn) throw new Error(MISSING_FCN);

  const logger = Client.getLogger('Register and enroll user');
  const { channelName, fabricNetwork, connectionProfile, wallet } = option;
  const gateway = new Gateway();

  await gateway.connect(connectionProfile, {
    identity,
    wallet,
    eventHandlerOptions: { strategy: eventHandlerStrategies },
    queryHandlerOptions: { strategy: queryHandlerStrategies },
    discovery: { asLocalhost, enabled: true }
  });

  const network: Network = await gateway.getNetwork(channelName);

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
    submit: () =>
      network
        .getContract(chaincodeId)
        .createTransaction(fcn)
        .submit(...args)
        .then<Record<string, Commit>>((res: any) => {
          logger.info(util.format('successfully submit tx: %s', fcn));
          return JSON.parse(Buffer.from(JSON.parse(res)).toString());
        })
        .catch(error => {
          logger.error(util.format('submit tx error in %s: %j', fcn, error));
          return { error };
        })
  };
};
