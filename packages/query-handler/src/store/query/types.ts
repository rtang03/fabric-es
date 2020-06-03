import { Commit } from '@fabric-es/fabric-cqrs';

export interface DeleteByEntityIdAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
    };
  };
}

export interface DeleteByEntityNameAction {
  type: string;
  payload?: {
    tx_id: string;
    args: { entityName: string };
  };
}
export interface QueryByEntityNameAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
    };
  };
}

export interface QueryByEntityIdAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
    };
  };
}

export interface MergeAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      commit: Commit;
    };
  };
}

export interface MergeBatchAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      commits: Record<string, Commit>;
    };
  };
}

export type QueryActions =
  | DeleteByEntityIdAction
  | DeleteByEntityNameAction
  | QueryByEntityNameAction
  | QueryByEntityIdAction
  | MergeAction
  | MergeBatchAction;
