import { TradeEvent, TradePrivilegeDefined, User } from '../../types';
import { errors, Privilege, privileges } from '../../types';

/**
 * Create trade
 * @param user
 * @param tradeId
 * @param title
 * @param description
 * @param timestamp
 */
export function createTrade({
  user,
  tradeId,
  title,
  description,
  timestamp
}: {
  user: User;
  tradeId: string;
  title: string;
  description: string;
  timestamp: number;
}): TradeEvent[] {
  // Not implemented yet
  // if (!privileges.canCreateTrade(user)) {
  //   throw errors.permisionDenied();
  // }

  const adminPrivileges: Privilege[] = [
    'canUpdateTrade',
    'canUpdatePrivilege',
    'canUpdateEditor',
    'canDeleteTrade',
    'canCreateDocument',
    'canDeleteDocument',
    'canBanDocument',
    'canUpdateDocument'
  ];

  return [
    {
      type: 'TradeCreated',
      payload: {
        tradeId,
        ownerId: user.userId,
        timestamp
      }
    },
    {
      type: 'TradeTitleDefined',
      payload: {
        tradeId,
        title,
        timestamp
      }
    },
    {
      type: 'TradeDescriptionDefined',
      payload: {
        tradeId,
        description,
        timestamp
      }
    },
    ...adminPrivileges.map(
      privilege =>
        ({
          type: 'TradePrivilegeDefined',
          payload: {
            tradeId,
            privilege,
            permission: { users: [user.userId] },
            timestamp
          }
        } as TradePrivilegeDefined)
    )
  ];
}
