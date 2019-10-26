import { errors, privileges, Trade, TradeEvent, User } from '../../types';

export const defineTradePrivilege = ({
  user,
  trade,
  privilege,
  permission,
  timestamp
}: {
  user: User;
  trade: Trade;
  privilege: any;
  permission: any;
  timestamp: number;
}): TradeEvent[] => {
  if (!privileges.canUpdatePrivilege(user, trade))
    throw errors.permisionDenied();

  return [
    {
      type: 'TradePrivilegeDefined',
      payload: {
        tradeId: trade.tradeId,
        privilege,
        permission,
        timestamp
      }
    }
  ];
};
