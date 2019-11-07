import { UserEvent, UserInfo } from '../../user';
import { TradePermission } from './model';

export interface PublicCommands {
  CreateTrade: {
    userId: string;
    payload: {
      tradeId: string;
      title: string;
      description: string;
      timestamp: number;
    };
  };
  AddTradeEditor: {
    userId: string;
    payload: {
      tradeId: string;
      editorInfo: UserInfo;
      timestamp: number;
    };
  };
  ConfirmTradeEditor: {
    userId: string;
    payload: {
      editorId: string;
      editorInfo: UserInfo;
      tradeId: string;
      timestamp: number;
    };
  };
  DefineTradeDescription: {
    userId: string;
    payload: {
      tradeId: string;
      description: string;
      timestamp: number;
    };
  };
  DefineTradePrivilege: {
    userId: string;
    payload: {
      tradeId: string;
      privilege: string;
      permission: TradePermission;
      timestamp: number;
    };
  };
  DefineTradeTitle: {
    userId: string;
    payload: {
      tradeId: string;
      title: string;
      timestamp: number;
    };
  };
  DeleteTrade: {
    userId: string;
    payload: {
      tradeId: string;
      timestamp: number;
    };
  };
  RemoveTradeEditor: {
    userId: string;
    payload: {
      tradeId: string;
      editorId: string;
      timestamp: number;
    };
  };
  RemoveTradePermission: {
    userId: string;
    payload: {
      tradeId: string;
      privilege: string;
      timestamp: number;
    };
  };
}
