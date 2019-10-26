import { isArray } from 'lodash';

import { Trade, TradePermission, User } from '.';

export type Privilege =
  | 'canApproveDocument'
  | 'canBanDocument'
  | 'canCreateDocument'
  | 'canDeleteDocument'
  | 'canDeleteTrade'
  | 'canReviewDocument'
  | 'canSubmitDocument'
  | 'canUpdateDocument'
  | 'canUpdateEditor'
  | 'canUpdatePrivilege'
  | 'canUpdateTrade';

type HasPermission = (user: User, trade: Trade) => boolean;

// for use in event creation
export type TradePrivileges = { [K in Privilege]: HasPermission };

// for use in GraphQL API
export type PrivilegeConditions = { [K in Privilege]: TradePermission };

const tradePrivileges: TradePrivileges = {
  canApproveDocument: (u, n) => hasPermissions(u, n, 'canApproveDocument'),
  canBanDocument: (u, n) => hasPermissions(u, n, 'canBanDocument'),
  canCreateDocument: (u, n) => hasPermissions(u, n, 'canCreateDocument'),
  canDeleteDocument: (u, n) => hasPermissions(u, n, 'canDeleteDocument'),
  canDeleteTrade: (u, n) => hasPermissions(u, n, 'canDeleteTrade'),
  canReviewDocument: (u, n) => hasPermissions(u, n, 'canReviewDocument'),
  canSubmitDocument: (u, n) => hasPermissions(u, n, 'canSubmitDocument'),
  canUpdateDocument: (u, n) => hasPermissions(u, n, 'canUpdateDocument'),
  canUpdateEditor: (u, n) => hasPermissions(u, n, 'canUpdateEditor'),
  canUpdateTrade: (u, n) => hasPermissions(u, n, 'canUpdateTrade'),
  canUpdatePrivilege: (u, n) => hasPermissions(u, n, 'canUpdatePrivilege')
};

const hasPermissions = (user: User, trade: Trade, privilege: string) =>
  isListedUser(trade.privileges[privilege], user) || false;

const isListedUser = (permission: TradePermission, { userId }: User) =>
  !!permission &&
  isArray(permission.users) &&
  permission.users.includes(userId);

export const privileges = tradePrivileges;
