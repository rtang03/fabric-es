import { UserEvent } from '../../types';

/**
 * Expire review invitation
 * @param reviewOwnerId
 * @param documentId
 * @param tradeId
 * @param timestamp
 */
export function expireReviewInvitation({
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
      type: 'ReviewInvitationExpired',
      payload: {
        reviewOwnerId,
        documentId,
        tradeId,
        timestamp
      }
    }
  ];
}
