import { Wallet } from 'fabric-network';

export interface Context {
  channelTx?: string;
  fabricNetwork?: string;
  connProfileNetwork?: string;
  wallet?: Wallet;
}
