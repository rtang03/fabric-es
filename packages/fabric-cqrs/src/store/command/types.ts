import { Wallet } from 'fabric-network';
import { BaseEvent } from '../../types';

export interface CreateAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
      version: number;
      events: BaseEvent[];
      isPrivateData: boolean;
    };
    enrollmentId?: string;
    channelName?: string;
    connectionProfile?: string;
    wallet?: Wallet;
  };
}

export interface DeleteByEntityIdAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      id: string;
      isPrivateData: boolean;
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
      isPrivateData: boolean;
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
      isPrivateData: boolean;
    };
  };
}

export interface QueryByEntityNameAction {
  type: string;
  payload?: {
    tx_id: string;
    args: {
      entityName: string;
      isPrivateData: boolean;
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
      isPrivateData: boolean;
    };
  };
}
