import { errors, privileges, Trade, TradeEvent } from '../../types';
import { User, UserInfo } from '../../user';

export const deleteTrade = ({
  user,
  trade,
  timestamp
}: {
  user: User;
  trade: Trade;
  timestamp;
}): TradeEvent[] => {
  if (!privileges.canDeleteTrade(user, trade)) throw errors.permisionDenied();

  return [
    {
      type: 'TradeDeleted',
      payload: {
        userId: user.userId,
        tradeId: trade.tradeId,
        timestamp
      }
    }
  ];
};
