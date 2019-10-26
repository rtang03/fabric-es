import { errors, privileges, Trade, TradeEvent, User } from '../../types';

export const defineTradeTitle = ({
  user,
  trade,
  title,
  timestamp
}: {
  user: User;
  trade: Trade;
  title: string;
  timestamp: number;
}): TradeEvent[] => {
  if (!privileges.canUpdateTrade(user, trade)) {
    throw errors.permisionDenied();
  }

  return [
    {
      type: 'TradeTitleDefined',
      payload: {
        tradeId: trade.tradeId,
        title,
        timestamp
      }
    }
  ];
};
