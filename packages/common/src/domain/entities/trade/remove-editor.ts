import { errors, privileges, Trade, TradeEvent } from '../../types';
import { User, UserInfo } from '../../user';

export const removeTradeEditor = ({
  user,
  trade,
  editorId,
  timestamp
}: {
  user: User;
  trade: Trade;
  editorId: string;
  timestamp: number;
}): TradeEvent[] => {
  if (
    !trade.editors.invited.filter(({ userId }) => userId === editorId).length &&
    !trade.editors.confirmed.filter(({ userId }) => userId === editorId).length
  )
    throw errors.editorNotListed();

  if (!privileges.canUpdateEditor(user, trade)) throw errors.permisionDenied();

  return [
    {
      type: 'TradeEditorRemoved',
      payload: {
        tradeId: trade.tradeId,
        userId: user.userId,
        editorId,
        timestamp
      }
    }
  ];
};
