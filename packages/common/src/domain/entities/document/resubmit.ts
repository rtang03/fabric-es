import {
  Document,
  DocumentEvent,
  errors,
  privileges,
  Trade
} from '../../types';
import { User } from '../../user';

/**
 * Resubmit document
 * @param user
 * @param trade
 * @param document
 * @param timestamp
 */
export function resubmitDocument({
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
  if (document.banned) {
    throw errors.documentAlreadyBanned();
  }

  if (document.approved) {
    throw errors.documentAlreadyApproved();
  }

  if (document.reviewProcessCompleted) {
    throw errors.reviewProcessAlreadyCompleted();
  }

  if (document.ownerId !== user.userId) {
    throw errors.userIsNotOwner();
  }

  // if (!privileges.canResubmitDocument(user, trade))
  //   throw errors.permisionDenied();

  return [
    {
      type: 'DocumentResubmitted',
      payload: {
        documentId: document.documentId,
        timestamp
      }
    }
  ];
}
