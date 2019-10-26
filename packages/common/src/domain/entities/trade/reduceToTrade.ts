import { Trade, TradeEvent } from '../../types';

/**
 * Trade Reducer
 * @param history
 * @param initialState
 */
export function reduceToTrade(
  history: TradeEvent[],
  initialState?: Trade
): Trade {
  const tradeReducer = (trade: Trade, event: TradeEvent): Trade => {
    switch (event.type) {
      case 'TradeCreated':
        return {
          tradeId: event.payload.tradeId,
          description: null,
          title: null,
          privileges: null,
          editors: {
            invited: [],
            confirmed: []
          }
        };
      case 'TradeDescriptionDefined':
        return {
          ...trade,
          description: event.payload.description
        };
      case 'TradeTitleDefined':
        return {
          ...trade,
          title: event.payload.title
        };
      case 'TradeEditorAdded':
        return {
          ...trade,
          editors: {
            ...trade.editors,
            invited: [...trade.editors.invited, event.payload.editorInfo]
          }
        };
      case 'TradeEditorConfirmed':
        return {
          ...trade,
          editors: {
            invited: trade.editors.invited.filter(
              editor => editor.userId !== event.payload.editorInfo.userId
            ),
            confirmed: [...trade.editors.confirmed, event.payload.editorInfo]
          }
        };
      case 'TradeEditorRemoved':
        return {
          ...trade,
          editors: {
            invited: trade.editors.invited.filter(
              editor => editor.userId !== event.payload.editorId
            ),
            confirmed: trade.editors.confirmed.filter(
              editor => editor.userId !== event.payload.editorId
            )
          }
        };
      case 'TradePrivilegeDefined':
        return {
          ...trade,
          privileges: {
            ...trade.privileges,
            [event.payload.privilege]: event.payload.permission
          }
        };
      case 'TradePrivilegeRemoved':
        return {
          ...trade,
          privileges: {
            ...trade.privileges,
            [event.payload.privilege]: null
          }
        };
      default:
        return trade;
    }
  };

  return history.reduce(tradeReducer, initialState);
}
