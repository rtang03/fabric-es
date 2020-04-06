import { Wallet } from 'fabric-network';

export interface CreateNetworkOperatorOption {
  channelName: string;
  ordererTlsCaCert: string;
  ordererName: string;
  connectionProfile: string;
  fabricNetwork: string;
  caAdmin: string;
  caAdminPW: string;
  wallet: Wallet;
  mspId: string;
}
