import { PrivilegeConditions, UserInfo } from '..';

class Editors {
  invited: UserInfo[];

  confirmed: UserInfo[];
}

export class TradePermission {
  users: string[]; // userId[]
}

export class TradePrivilegeConditions implements Partial<PrivilegeConditions> {
  canApproveDocument?: TradePermission;

  canBanDocument?: TradePermission;

  canCreateDocument?: TradePermission;

  canDeleteDocument?: TradePermission;

  canDeleteTrade?: TradePermission;

  canReviewDocument?: TradePermission;

  canSubmitDocument?: TradePermission;

  canUpdateDocument?: TradePermission;

  canUpdateEditor?: TradePermission;

  canUpdatePrivilege?: TradePermission;

  canUpdateTrade?: TradePermission;
}

/**
 * **Trade** is placeholder, for identifying unique trade concept. Each trade is given unique `tradeId`. Trade entity defines
 * the privilege, and permission of underlying assets (i.e. Trade Document). It also defines choregraphic business process,
 * represented by Trade States.
 */
export class Trade {
  static type: 'trade';

  tradeId: string;

  description: string;

  title: string;

  privileges: TradePrivilegeConditions;

  editors: Editors;
}
