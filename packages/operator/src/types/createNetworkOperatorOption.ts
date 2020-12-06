import { Wallet } from 'fabric-network';

export interface CreateNetworkOperatorOption {
  channelName: string;
  connectionProfile: string;
  caAdmin: string;
  caAdminPW: string;
  wallet: Wallet;
  mspId: string;
  caName: string;
}
