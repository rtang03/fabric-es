import {
  Document,
  DocumentEvent,
  errors,
  privileges,
  Trade
} from '../../types';
import { User } from '../../user';

/**
 * Define document description
 * @param user
 * @param trade
 * @param document
 * @param description
 * @param timestamp
 */
export function defineDocumentDescription({
  user,
  trade,
  document,
  description,
  timestamp
}: {
  user: User;
  trade: Trade;
  document: Document;
  description: string;
  timestamp: number;
}): DocumentEvent[] {
  if (document.ownerId !== user.userId) throw errors.userIsNotOwner();

  if (!privileges.canUpdateDocument(user, trade))
    throw errors.permisionDenied();

  return [
    {
      type: 'DocumentDescriptionDefined',
      payload: {
        documentId: document.documentId,
        description,
        timestamp
      }
    }
  ];
}
