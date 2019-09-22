import { Store } from 'redux';
import { Commit, Reducer } from '../../../types';

export interface ReconcileAction {
  type: string;
  payload: {
    tx_id: string;
    args: {
      entityName: string;
      reducer: Reducer;
    };
    store: Store;
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
  };
}
