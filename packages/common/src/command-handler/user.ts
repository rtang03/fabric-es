import {
  createUser,
  declineReviewInvitation,
  expireReviewInvitation
} from '../domain/entities/user';
import { TradeRepo, UserCommandHandler, UserRepo } from '../domain/types';

export const userCommandHandler: (option: {
  enrollmentId: string;
  userRepo: UserRepo;
  tradeRepo: TradeRepo;
}) => UserCommandHandler = ({ enrollmentId, userRepo, tradeRepo }) => ({
  CreateUser: async ({ userId, payload: { name, timestamp } }) =>
    await userRepo
      .create({ enrollmentId, id: userId })
      .save(createUser({ userId, name, timestamp })),
  DeclineReviewInvitation: async ({
    userId,
    payload: { documentId, tradeId, timestamp }
  }) =>
    await userRepo.getById({ enrollmentId, id: userId }).then(({ save }) =>
      save(
        declineReviewInvitation({
          reviewOwnerId: userId,
          documentId,
          tradeId,
          timestamp
        })
      )
    ),
  ExpireReviewInvitation: async ({
    userId,
    payload: { documentId, tradeId, timestamp }
  }) =>
    await userRepo.getById({ enrollmentId, id: userId }).then(({ save }) =>
      save(
        expireReviewInvitation({
          reviewOwnerId: userId,
          documentId,
          tradeId,
          timestamp
        })
      )
    )
});
