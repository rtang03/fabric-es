import { Commit } from '../../types';

export interface MergeEntityAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      commit: Commit;
    };
  };
}

export interface MergeEntityBatchAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      commits: Record<string, Commit>;
    };
  };
}
