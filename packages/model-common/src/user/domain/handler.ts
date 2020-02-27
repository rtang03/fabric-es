import { UserCommandHandler, UserRepo } from '..';

export const userCommandHandler: (option: { enrollmentId: string; userRepo: UserRepo }) => UserCommandHandler = ({
  enrollmentId,
  userRepo
}) => ({
  CreateUser: async ({ userId, payload: { name, timestamp } }) =>
    userRepo.create({ enrollmentId, id: userId }).save([
      {
        type: 'UserCreated',
        payload: {
          userId,
          name,
          mergedUserIds: [userId],
          timestamp
        }
      }
    ]),
  DeclineReviewInvitation: async ({ userId, payload: { documentId, tradeId, timestamp } }) =>
    userRepo.getById({ enrollmentId, id: userId }).then(({ save }) =>
      save([
        {
          type: 'ReviewInvitationDeclined',
          payload: {
            reviewOwnerId: userId,
            documentId,
            tradeId,
            timestamp
          }
        }
      ])
    ),
  ExpireReviewInvitation: async ({ userId, payload: { documentId, tradeId, timestamp } }) =>
    userRepo.getById({ enrollmentId, id: userId }).then(({ save }) =>
      save([
        {
          type: 'ReviewInvitationExpired',
          payload: {
            reviewOwnerId: userId,
            documentId,
            tradeId,
            timestamp
          }
        }
      ])
    )
});
