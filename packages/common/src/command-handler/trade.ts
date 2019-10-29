import {
  addTradeEditor,
  confirmTradeEditor,
  createTrade,
  defineTradeDescription,
  defineTradePrivilege,
  defineTradeTitle,
  removeTradeEditor,
  removeTradePermission
} from '../domain/entities/trade';
import { deleteTrade } from '../domain/entities/trade/delete';
import { TradeCommandHandler, TradeRepo, UserRepo } from '../domain/types';

export const tradeCommandHandler: (option: {
  enrollmentId: string;
  userRepo: UserRepo;
  tradeRepo: TradeRepo;
}) => TradeCommandHandler = ({ enrollmentId, userRepo, tradeRepo }) => ({
  CreateTrade: async ({
    userId,
    payload: { tradeId, description, title, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .create({ enrollmentId, id: tradeId })
      .save(createTrade({ user, tradeId, description, title, timestamp }));
  },
  AddTradeEditor: async ({
    userId,
    payload: { tradeId, editorInfo, timestamp }
  }) => {
    const user = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .getById({ enrollmentId, id: tradeId })
      .then(({ currentState, save }) =>
        save(
          addTradeEditor({ user, trade: currentState, editorInfo, timestamp })
        )
      );
  },
  ConfirmTradeEditor: async ({
    userId,
    payload: { tradeId, editorInfo, timestamp }
  }) => {
    const editor = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .getById({ enrollmentId, id: tradeId })
      .then(({ currentState, save }) =>
        save(
          confirmTradeEditor({
            editor,
            trade: currentState,
            editorInfo,
            timestamp
          })
        )
      );
  },
  DefineTradeDescription: async ({
    userId,
    payload: { tradeId, description, timestamp }
  }) => {
    const user = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .getById({ enrollmentId, id: tradeId })
      .then(({ currentState, save }) =>
        save(
          defineTradeDescription({
            user,
            trade: currentState,
            description,
            timestamp
          })
        )
      );
  },
  DefineTradeTitle: async ({
    userId,
    payload: { tradeId, title, timestamp }
  }) => {
    const user = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .getById({ enrollmentId, id: tradeId })
      .then(({ currentState, save }) =>
        save(defineTradeTitle({ user, trade: currentState, title, timestamp }))
      );
  },
  DefineTradePrivilege: async ({
    userId,
    payload: { tradeId, privilege, permission, timestamp }
  }) => {
    const user = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .getById({ enrollmentId, id: tradeId })
      .then(({ currentState, save }) =>
        save(
          defineTradePrivilege({
            user,
            trade: currentState,
            privilege,
            permission,
            timestamp
          })
        )
      );
  },
  DeleteTrade: async ({ userId, payload: { tradeId, timestamp } }) => {
    const user = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .getById({ enrollmentId, id: tradeId })
      .then(({ currentState, save }) =>
        save(deleteTrade({ user, trade: currentState, timestamp }))
      );
  },
  RemoveTradeEditor: async ({
    userId,
    payload: { tradeId, editorId, timestamp }
  }) => {
    const user = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .getById({ enrollmentId, id: tradeId })
      .then(({ currentState, save }) =>
        save(
          removeTradeEditor({
            user,
            trade: currentState,
            editorId,
            timestamp
          })
        )
      );
  },
  RemoveTradePermission: async ({
    userId,
    payload: { tradeId, privilege, timestamp }
  }) => {
    const user = await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => currentState);
    return tradeRepo
      .getById({ enrollmentId, id: tradeId })
      .then(({ currentState, save }) =>
        save(
          removeTradePermission({
            user,
            trade: currentState,
            privilege,
            timestamp
          })
        )
      );
  }
});
