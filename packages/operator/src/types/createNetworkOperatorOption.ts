import { Wallet } from 'fabric-network';

export type CreateNetworkOperatorOption = {
  channelName: string;
  connectionProfile: string;
  caAdmin: string;
  caAdminPW: string;
  wallet: Wallet;
  mspId: string;
  caName: string;
};
