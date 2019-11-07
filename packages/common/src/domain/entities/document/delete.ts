import {
  Document,
  DocumentEvent,
  errors,
  privileges,
  Trade
} from '../../types';
import { User } from '../../user';

/**
 * Delete document
 * @param user
 * @param trade
 * @param document
 * @param timestamp
 */
export function deleteDocument({
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
  if (!privileges.canCreateDocument(user, trade)) {
    throw errors.permisionDenied();
  }

  return [
    {
      type: 'DocumentDeleted',
      payload: {
        documentId: document.documentId,
        userId: user.userId,
        timestamp
      }
    }
  ];
}
