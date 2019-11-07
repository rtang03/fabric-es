import {
  Document,
  DocumentEvent,
  errors,
  privileges,
  Trade
} from '../../types';
import { User } from '../../user';

/**
 * Reject approve document
 * @param user
 * @param trade
 * @param document
 * @param timestamp
 */
export function rejectApprovedDocument({
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
  // todo: approval is not implemented yet
  // if (document.approved === false) {
  //   throw errors.documentNotApproved()
  // }
  // if (!privileges.canRejectApprovedDocument(user, trade))
  //   throw errors.permisionDenied();

  return [
    {
      type: 'DocumentRejected',
      payload: {
        documentId: document.documentId,
        timestamp
      }
    }
  ];
}
