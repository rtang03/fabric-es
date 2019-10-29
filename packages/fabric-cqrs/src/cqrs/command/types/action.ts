import { BaseEvent } from '../../../types';

export interface CreateAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
      version: number;
      events: BaseEvent[];
      collection?: string;
    };
    enrollmentId?: string;
  };
}

export interface DeleteByEntityIdAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
      collection?: string;
    };
  };
}

export interface DeleteByEntityIdCommitIdAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
      commitId: string;
      collection?: string;
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
      collection?: string;
    };
  };
}

export interface QueryByEntityNameAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      collection?: string;
    };
  };
}

export interface QueryByEntIdCommitIdAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
      commitId: string;
      collection?: string;
    };
  };
}

export type CommandActions =
  | CreateAction
  | DeleteByEntityIdAction
  | DeleteByEntityIdCommitIdAction
  | QueryByEntityIdAction
  | QueryByEntityNameAction
  | QueryByEntIdCommitIdAction;
