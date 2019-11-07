import { errors, Trade, TradeEvent } from '../../types';
import { User, UserInfo } from '../../user';

export const confirmTradeEditor = ({
  editor,
  trade,
  editorInfo,
  timestamp
}: {
  editor: User;
  trade: Trade;
  editorInfo: UserInfo;
  timestamp: number;
}): TradeEvent[] => {
  if (
    !trade.editors.invited.filter(({ userId }) => userId === editorInfo.userId)
      .length
  )
    throw errors.editorNotInvited();

  if (
    trade.editors.confirmed.filter(({ userId }) => userId === editorInfo.userId)
      .length
  )
    throw errors.editorAlreadyConfirmed();

  return [
    {
      type: 'TradeEditorConfirmed',
      payload: {
        tradeId: trade.tradeId,
        editorId: editor.userId,
        editorInfo,
        timestamp
      }
    }
  ];
};
