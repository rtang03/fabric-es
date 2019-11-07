import {
  Document,
  DocumentEvent,
  errors,
  privileges,
  Trade
} from '../../types';
import { User } from '../../user';

/**
 * Ban document
 * @param user
 * @param trade
 * @param document
 * @param timestamp
 */
export function banDocument({
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
  if (document.banned) throw errors.documentAlreadyBanned();

  if (!privileges.canBanDocument(user, trade)) throw errors.permisionDenied();

  return [
    {
      type: 'DocumentBanned',
      payload: {
        documentId: document.documentId,
        userId: user.userId,
        timestamp
      }
    }
  ];
}
