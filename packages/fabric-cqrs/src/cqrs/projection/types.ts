import { Commit } from '../../types';

export interface FindAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      where?: Record<string, any>;
      all?: boolean;
      contain?: string | number;
    };
  };
}

export interface UpsertAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      commit: Record<string, Commit>;
    };
  };
}

export interface UpsertManyAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      commits: Record<string, Commit>;
    };
  };
}
