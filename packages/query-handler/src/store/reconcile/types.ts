import { Commit, Reducer } from '@fabric-es/fabric-cqrs';
import { Wallet } from 'fabric-network';
import { Store } from 'redux';

export interface ReconcileAction {
  type: string;
  payload: {
    tx_id: string;
    args: {
      entityName: string;
      reducer: Reducer;
    };
    store: Store;
    channelEventHub?: string;
    channelName?: string;
    connectionProfile?: string;
    wallet?: Wallet;
  };
}

export interface MergeAction {
  type: string;
  payload: {
    tx_id: string;
    args: {
      entityName: string;
      commits: Record<string, Commit>;
      reducer: Reducer;
    };
    store: Store;
    channelEventHub?: string;
    channelName?: string;
    connectionProfile?: string;
    wallet?: Wallet;
  };
}
