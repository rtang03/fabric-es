import { BaseEvent } from '@espresso/fabric-cqrs';
import { UserInfo } from '../user';
import { TradePermission } from './model';

export interface TradeCreated extends BaseEvent {
  readonly type: 'TradeCreated';
  payload: {
    tradeId: string;
    ownerId: string;
    timestamp: number;
  };
}

export interface TradeDeleted extends BaseEvent {
  readonly type: 'TradeDeleted';
  payload: {
    userId: string;
    tradeId: string;
    timestamp: number;
  };
}

export interface TradeDescriptionDefined extends BaseEvent {
  readonly type: 'TradeDescriptionDefined';
  payload: {
    tradeId: string;
    description: string;
    timestamp: number;
  };
}

export interface TradeEditorAdded extends BaseEvent {
  readonly type: 'TradeEditorAdded';
  payload: {
    tradeId: string;
    userId: string;
    editorInfo: UserInfo;
    timestamp: number;
  };
}

export interface TradeEditorConfirmed extends BaseEvent {
  readonly type: 'TradeEditorConfirmed';
  payload: {
    editorId: string;
    editorInfo: UserInfo;
    tradeId: string;
    timestamp: number;
  };
}

export interface TradeEditorRemoved extends BaseEvent {
  readonly type: 'TradeEditorRemoved';
  payload: {
    tradeId: string;
    userId: string;
    editorId: string;
    timestamp: number;
  };
}

export interface TradePrivilegeDefined extends BaseEvent {
  readonly type: 'TradePrivilegeDefined';
  payload: {
    tradeId: string;
    privilege: string;
    permission: TradePermission;
    timestamp: number;
  };
}

export interface TradePrivilegeRemoved extends BaseEvent {
  readonly type: 'TradePrivilegeRemoved';
  payload: {
    tradeId: string;
    privilege: string;
    timestamp: number;
  };
}

export interface TradeTitleDefined extends BaseEvent {
  readonly type: 'TradeTitleDefined';
  payload: {
    tradeId: string;
    title: string;
    timestamp: number;
  };
}

export type TradeEvent =
  | TradeCreated
  | TradeDeleted
  | TradeDescriptionDefined
  | TradeEditorAdded
  | TradeEditorConfirmed
  | TradeEditorRemoved
  | TradePrivilegeDefined
  | TradePrivilegeRemoved
  | TradeTitleDefined;
