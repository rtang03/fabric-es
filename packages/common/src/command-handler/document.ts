import {
  banDocument,
  createDocument,
  defineDocumentDescription,
  defineDocumentLink,
  defineDocumentTitle,
  deleteDocument,
  rejectApprovedDocument,
  resubmitDocument,
  unbanDocument
} from '../domain/entities/document';
import {
  DocCommandHandler,
  DocRepo,
  TradeRepo,
  UserRepo
} from '../domain/types';

export const docCommandHandler: (option: {
  userRepo: UserRepo;
  tradeRepo: TradeRepo;
  docRepo: DocRepo;
}) => DocCommandHandler = ({ userRepo, tradeRepo, docRepo }) => ({
  CreateDocument: async ({
    userId,
    payload: { tradeId, documentId, description, title, link, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    return docRepo.create(documentId).save(
      createDocument({
        user,
        trade,
        documentId,
        title,
        description,
        link,
        timestamp
      })
    );
  },
  BanDocument: async ({
    userId,
    payload: { tradeId, documentId, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    // todo: check if document not exist (i.e. null), and throw exception.
    return docRepo.getById(documentId).then(({ currentState, save }) =>
      save(
        banDocument({
          user,
          trade,
          document: currentState,
          timestamp
        })
      )
    );
  },
  DeleteDocument: async ({
    userId,
    payload: { tradeId, documentId, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    // todo: check if document not exist (i.e. null), and throw exception.
    return docRepo.getById(documentId).then(({ currentState, save }) =>
      save(
        deleteDocument({
          user,
          trade,
          document: currentState,
          timestamp
        })
      )
    );
  },
  UnbanDocument: async ({
    userId,
    payload: { tradeId, documentId, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    // todo: check if document not exist (i.e. null), and throw exception.
    return docRepo.getById(documentId).then(({ currentState, save }) =>
      save(
        unbanDocument({
          user,
          trade,
          document: currentState,
          timestamp
        })
      )
    );
  },
  DefineDocumentDescription: async ({
    userId,
    payload: { tradeId, documentId, description, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    // todo: check if document not exist (i.e. null), and throw exception.
    return docRepo.getById(documentId).then(({ currentState, save }) =>
      save(
        defineDocumentDescription({
          user,
          trade,
          document: currentState,
          description,
          timestamp
        })
      )
    );
  },
  DefineDocumentLink: async ({
    userId,
    payload: { tradeId, documentId, link, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    // todo: check if document not exist (i.e. null), and throw exception.
    return docRepo.getById(documentId).then(({ currentState, save }) =>
      save(
        defineDocumentLink({
          user,
          trade,
          document: currentState,
          link,
          timestamp
        })
      )
    );
  },
  DefineDocumentTitle: async ({
    userId,
    payload: { tradeId, documentId, title, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    // todo: check if document not exist (i.e. null), and throw exception.
    return docRepo.getById(documentId).then(({ currentState, save }) =>
      save(
        defineDocumentTitle({
          user,
          trade,
          document: currentState,
          title,
          timestamp
        })
      )
    );
  },
  RejectApprovedDocument: async ({
    userId,
    payload: { tradeId, documentId, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    // todo: check if document not exist (i.e. null), and throw exception.
    return docRepo.getById(documentId).then(({ currentState, save }) =>
      save(
        rejectApprovedDocument({
          user,
          trade,
          document: currentState,
          timestamp
        })
      )
    );
  },
  ResubmitDocument: async ({
    userId,
    payload: { tradeId, documentId, timestamp }
  }) => {
    // todo: check if user not exist (i.e. null), and throw exception.
    const user = await userRepo
      .getById(userId)
      .then(({ currentState }) => currentState);

    // todo: check if trade not exist (i.e. null), and throw exception.
    const trade = await tradeRepo
      .getById(tradeId)
      .then(({ currentState }) => currentState);

    // todo: check if document not exist (i.e. null), and throw exception.
    return docRepo.getById(documentId).then(({ currentState, save }) =>
      save(
        resubmitDocument({
          user,
          trade,
          document: currentState,
          timestamp
        })
      )
    );
  }
});
