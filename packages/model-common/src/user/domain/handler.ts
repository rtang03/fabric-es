import values from 'lodash/values';
import { UserCommandHandler, UserRepo } from '..';

export const userCommandHandler: (option: {
  enrollmentId: string;
  userRepo: UserRepo;
}) => UserCommandHandler = ({ enrollmentId, userRepo }) => ({
  CreateUser: async ({ userId, payload: { name, timestamp } }) =>
    userRepo
      .create({ enrollmentId, id: userId })
      .save({
        events: [
          {
            type: 'UserCreated',
            payload: {
              userId,
              name,
              mergedUserIds: [userId],
              timestamp,
            },
          },
        ],
      })
      .then(({ data, status }) => (status === 'OK' ? values(data)[0] : null)),
  DeclineReviewInvitation: async ({ userId, payload: { documentId, tradeId, timestamp } }) =>
    userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ save }) =>
        save({
          events: [
            {
              type: 'ReviewInvitationDeclined',
              payload: {
                reviewOwnerId: userId,
                documentId,
                tradeId,
                timestamp,
              },
            },
          ],
        })
      )
      .then(({ data, status }) => (status === 'OK' ? values(data)[0] : null)),
  ExpireReviewInvitation: async ({ userId, payload: { documentId, tradeId, timestamp } }) =>
    userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ save }) =>
        save({
          events: [
            {
              type: 'ReviewInvitationExpired',
              payload: {
                reviewOwnerId: userId,
                documentId,
                tradeId,
                timestamp,
              },
            },
          ],
        })
      )
      .then(({ data, status }) => (status === 'OK' ? values(data)[0] : null)),
});
