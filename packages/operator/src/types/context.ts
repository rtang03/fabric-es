import { Wallet } from 'fabric-network';

export interface Context {
  fabricNetwork?: string;
  channelTx?: string;
  connectionProfile?: string;
  wallet?: Wallet;
}
