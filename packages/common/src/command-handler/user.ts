import {
  createUser,
  declineReviewInvitation,
  expireReviewInvitation
} from '../domain/entities/user';
import { TradeRepo, UserCommandHandler, UserRepo } from '../domain/types';

export const userCommandHandler: (option: {
  userRepo: UserRepo;
  tradeRepo: TradeRepo;
}) => UserCommandHandler = ({ userRepo, tradeRepo }) => ({
  CreateUser: async ({ userId, payload: { name, timestamp } }) =>
    await userRepo.create(userId).save(createUser({ userId, name, timestamp })),
  DeclineReviewInvitation: async ({
    userId,
    payload: { documentId, tradeId, timestamp }
  }) =>
    await userRepo.getById(userId).then(({ save }) =>
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
    await userRepo.getById(userId).then(({ save }) =>
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
