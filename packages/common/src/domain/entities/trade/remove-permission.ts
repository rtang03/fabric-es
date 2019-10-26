import { errors, privileges, Trade, TradeEvent, User } from '../../types';

export const removeTradePermission = ({
  user,
  trade,
  privilege,
  timestamp
}: {
  user: User;
  trade: Trade;
  privilege: string;
  timestamp: number;
}): TradeEvent[] => {
  if (!privileges.canUpdatePrivilege(user, trade))
    throw errors.permisionDenied();

  return [
    {
      type: 'TradePrivilegeRemoved',
      payload: {
        tradeId: trade.tradeId,
        privilege,
        timestamp
      }
    }
  ];
};
