import { errors, privileges, Trade, TradeEvent } from '../../types';
import { User, UserInfo } from '../../user';

export const defineTradeDescription = ({
  user,
  trade,
  description,
  timestamp
}: {
  user: User;
  trade: Trade;
  description: string;
  timestamp: number;
}): TradeEvent[] => {
  if (!privileges.canUpdateTrade(user, trade)) throw errors.permisionDenied();

  return [
    {
      type: 'TradeDescriptionDefined',
      payload: {
        tradeId: trade.tradeId,
        description,
        timestamp
      }
    }
  ];
};
