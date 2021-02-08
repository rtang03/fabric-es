import type { FTSearchParameters } from 'redis-modules-sdk';
import type { Commit } from '../../types';

export interface DeleteCommitByEntityIdAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
    };
  };
}

export interface DeleteCommitByEntityNameAction {
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

export interface CIdxSearchAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      query: string;
      param?: FTSearchParameters;
      countTotalOnly?: boolean;
    };
  };
}

export interface EIdxSearchAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      query: string;
      param?: FTSearchParameters;
      countTotalOnly?: boolean;
    };
  };
}

export interface FindAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      byId?: string;
      byDesc?: string;
      where?: any;
    };
  };
}

export interface NotifyAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      creator: string;
      commitId: string;
      entityName: string;
      id: string;
    };
  };
}
