import {
  Document,
  DocumentEvent,
  errors,
  privileges,
  Trade,
  User
} from '../../types';

/**
 * Define document title
 * @param user
 * @param trade
 * @param document
 * @param title
 * @param timestamp
 */
export function defineDocumentTitle({
  user,
  trade,
  document,
  title,
  timestamp
}: {
  user: User;
  trade: Trade;
  document: Document;
  title: string;
  timestamp: number;
}): DocumentEvent[] {
  if (document.ownerId !== user.userId) throw errors.userIsNotOwner();

  if (!privileges.canUpdateDocument(user, trade))
    throw errors.permisionDenied();

  return [
    {
      type: 'DocumentTitleDefined',
      payload: {
        documentId: document.documentId,
        title,
        timestamp
      }
    }
  ];
}
