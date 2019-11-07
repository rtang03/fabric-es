import { DocumentEvent, errors, privileges, Trade } from '../../types';
import { User } from '../../user';

/**
 * Create document
 * @param user
 * @param trade
 * @param documentId
 * @param title
 * @param description
 * @param link
 * @param timestamp
 */
export function createDocument({
  user,
  trade,
  documentId,
  title,
  description,
  link,
  timestamp
}: {
  user: User;
  trade: Trade;
  documentId: string;
  title: string;
  description: string;
  link: string;
  timestamp: number;
}): DocumentEvent[] {
  if (!privileges.canCreateDocument(user, trade))
    throw errors.permisionDenied();

  return [
    {
      type: 'DocumentCreated',
      payload: {
        ownerId: user.userId,
        tradeId: trade.tradeId,
        documentId,
        timestamp
      }
    },
    {
      type: 'DocumentLinkDefined',
      payload: {
        documentId,
        link,
        timestamp
      }
    },
    {
      type: 'DocumentDescriptionDefined',
      payload: {
        documentId,
        description,
        timestamp
      }
    },
    {
      type: 'DocumentTitleDefined',
      payload: {
        documentId,
        title,
        timestamp
      }
    }
  ];
}
