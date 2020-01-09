import { Wallet } from 'fabric-network';
import { Context } from './context';

export interface CreateNetworkOperatorOption {
  channelName?: string;
  ordererTlsCaCert?: string;
  ordererName?: string;
  context?: Context;
  connectionProfile?: string;
  fabricNetwork?: string;
  wallet?: Wallet;
}
