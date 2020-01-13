import Client from 'fabric-client';
import {
  createChannel,
  getQueries,
  identityService,
  install,
  instantiateOrUpdate,
  joinChannel,
  registerAndEnroll,
  submitOrEvaluateTx,
  updateAnchorPeers
} from './tasks';
import {
  CreateNetworkOperatorOption,
  MISSING_CHANNELNAME,
  MISSING_CONNECTION_PROFILE,
  MISSING_FABRIC_NETWORK,
  MISSING_WALLET,
  NetworkOperator
} from './types';

export const createNetworkOperator = async (
  option: CreateNetworkOperatorOption
): Promise<NetworkOperator> => {
  const { channelName, ordererTlsCaCert, ordererName, context } = option;
  const fabricNetwork = context?.fabricNetwork;
  const connectionProfile = context?.connectionProfile;
  const wallet = context?.wallet;

  if (!channelName) throw new Error(MISSING_CHANNELNAME);
  if (!connectionProfile) throw new Error(MISSING_CONNECTION_PROFILE);
  if (!fabricNetwork) throw new Error(MISSING_FABRIC_NETWORK);
  if (!wallet) throw new Error(MISSING_WALLET);

  const args = {
    channelName,
    ordererTlsCaCert,
    ordererName,
    connectionProfile,
    fabricNetwork,
    wallet
  };

  return {
    createChannel: createChannel(args),
    getQueries: getQueries(args),
    identityService: identityService(args),
    install: install(args),
    instantiate: instantiateOrUpdate(args),
    joinChannel: joinChannel(args),
    registerAndEnroll: registerAndEnroll(args),
    submitOrEvaluateTx: submitOrEvaluateTx(args),
    updateAnchorPeers: updateAnchorPeers(args)
  };
};
