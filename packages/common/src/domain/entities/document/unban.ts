import {
  Document,
  DocumentEvent,
  errors,
  privileges,
  Trade
} from '../../types';
import { User } from '../../user';

/**
 * Unban document
 * @param user
 * @param trade
 * @param document
 * @param timestamp
 */
export function unbanDocument({
  user,
  trade,
  document,
  timestamp
}: {
  user: User;
  trade: Trade;
  document: Document;
  timestamp: number;
}): DocumentEvent[] {
  if (!document.banned) {
    throw errors.documentNotBanned();
  }

  if (!privileges.canBanDocument(user, trade)) throw errors.permisionDenied();

  return [
    {
      type: 'DocumentUnbanned',
      payload: {
        documentId: document.documentId,
        userId: user.userId,
        timestamp
      }
    }
  ];
}
