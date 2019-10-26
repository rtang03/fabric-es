import { UserEvent } from '../../types';

/**
 * Decline review invitation
 * @param reviewOwnerId
 * @param documentId
 * @param tradeId
 * @param timestamp
 */
export function declineReviewInvitation({
  reviewOwnerId,
  documentId,
  tradeId,
  timestamp
}: {
  reviewOwnerId: string;
  documentId: string;
  tradeId: string;
  timestamp: number;
}): UserEvent[] {
  return [
    {
      type: 'ReviewInvitationDeclined',
      payload: {
        reviewOwnerId,
        documentId,
        tradeId,
        timestamp
      }
    }
  ];
}
