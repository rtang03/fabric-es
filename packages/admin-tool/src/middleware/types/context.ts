import { Wallet } from 'fabric-network';

export interface Context {
  channelTx?: string;
  fabricNetwork?: string;
  connectionProfile?: string;
  wallet?: Wallet;
}
