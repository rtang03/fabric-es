import {
  errors,
  privileges,
  Trade,
  TradeEvent,
  User,
  UserInfo
} from '../../types';

export const addTradeEditor = ({
  user,
  trade,
  editorInfo,
  timestamp
}: {
  user: User;
  trade: Trade;
  editorInfo: UserInfo;
  timestamp: number;
}): TradeEvent[] => {
  if (
    trade.editors.invited.filter(({ userId }) => userId === editorInfo.userId)
      .length
  )
    throw errors.editorAlreadyInvited();

  // todo logical bug, this will not call, editorAlreadyInvited will be always trigger, before editorAlreadyConfirmed is check. let handle it later
  if (
    trade.editors.confirmed.filter(({ userId }) => userId === editorInfo.userId)
      .length
  )
    throw errors.editorAlreadyConfirmed();

  if (!privileges.canUpdateEditor(user, trade)) throw errors.permisionDenied();

  return [
    {
      type: 'TradeEditorAdded',
      payload: {
        tradeId: trade.tradeId,
        userId: user.userId,
        editorInfo,
        timestamp
      }
    }
  ];
};
