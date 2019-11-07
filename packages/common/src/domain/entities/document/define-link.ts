import {
  Document,
  DocumentEvent,
  errors,
  privileges,
  Trade
} from '../../types';
import { User } from '../../user';

/**
 * Define document link
 * @param user
 * @param trade
 * @param document
 * @param link
 * @param timestamp
 */
export function defineDocumentLink({
  user,
  trade,
  document,
  link,
  timestamp
}: {
  user: User;
  trade: Trade;
  document: Document;
  link: string;
  timestamp: number;
}): DocumentEvent[] {
  if (document.ownerId !== user.userId) throw errors.userIsNotOwner();

  if (!privileges.canUpdateDocument(user, trade))
    throw errors.permisionDenied();

  return [
    {
      type: 'DocumentLinkDefined',
      payload: {
        documentId: document.documentId,
        link,
        timestamp
      }
    }
  ];
}
