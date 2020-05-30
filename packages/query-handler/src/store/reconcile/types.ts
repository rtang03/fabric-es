import { Commit } from '@fabric-es/fabric-cqrs';
import { Wallet } from 'fabric-network';
import { Store } from 'redux';

export interface ReconcileAction {
  type: string;
  payload: {
    tx_id: string;
    args: {
      entityName: string;
    };
    store: Store;
    channelEventHub?: string;
    channelName?: string;
    connectionProfile?: string;
    wallet?: Wallet;
  };
}

export interface MergeCommitBatchAction {
  type: string;
  payload: {
    tx_id: string;
    args: {
      entityName: string;
      commits: Record<string, Commit>;
    };
    store: Store;
    channelEventHub?: string;
    channelName?: string;
    connectionProfile?: string;
    wallet?: Wallet;
  };
}

export interface MergeEntityBatchAction {
  type: string;
  payload: {
    tx_id: string;
    args: {
      entityName: string;
      commits: Record<string, Commit>;
    };
    store: Store;
  };
}
