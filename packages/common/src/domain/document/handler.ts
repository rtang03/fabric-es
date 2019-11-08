import { DocumentCommandHandler, DocumentRepo } from '.';
import { Errors } from '..';
import { UserRepo } from '../user';

const DocumentErrors = {
  documentNotFound: (documentId) => new Error(`DOCUMENT_NOT_FOUND: id: ${documentId}`),
  documentCancelled: () => new Error('DOCUMENT_CANCELLED'),
  documentApproved: () => new Error('DOCUMENT_APPROVED'),
};

export const documentCommandHandler: (
  option: {
    enrollmentId: string;
    userRepo: UserRepo;
    documentRepo: DocumentRepo;
  }
) => DocumentCommandHandler = ({
  enrollmentId, userRepo, documentRepo
}) => ({
  CreateDocument: async ({
    userId,
    payload: { documentId, loanId, title, reference, link, timestamp }
  }) => {
    await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => {
        if (!currentState) throw Errors.insufficientPrivilege;
      });
    if (!reference) throw Errors.requiredDataMissing;
    if (!link) throw Errors.requiredDataMissing;
    const events: any = [
      { type: 'DocumentCreated', payload: { documentId, userId, timestamp }},
      { type: 'DocumentReferenceDefined', payload: { documentId, userId, reference, timestamp }},
      { type: 'DocumentLinkDefined', payload: { documentId, userId, link, timestamp }}
    ];
    if (loanId) events.push({ type: 'DocumentLoanIdDefined', payload: { documentId, userId, loanId, timestamp }});
    if (title) events.push({ type: 'DocumentTitleDefined', payload: { documentId, userId, title, timestamp }});
    return documentRepo
      .create({ enrollmentId, id: documentId })
      .save(events);
  },
  DeleteDocument: async ({
    userId,
    payload: { documentId, timestamp }
  }) => {
    await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => {
        if (!currentState) throw Errors.insufficientPrivilege;
      });
    return documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([{
          type: 'DocumentDeleted',
          payload: { documentId, userId, timestamp }
        }]);
      });
  },
  RestrictDocumentAccess: async ({
    userId,
    payload: { documentId, timestamp }
  }) => {
    await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => {
        if (!currentState) throw Errors.insufficientPrivilege;
      });
    return documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([{
          type: 'DocumentRestricted',
          payload: { documentId, userId, timestamp }
        }]);
      });
  },
  DefineDocumentReference: async ({
    userId,
    payload: { documentId, reference, timestamp }
  }) => {
    await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => {
        if (!currentState) throw Errors.insufficientPrivilege;
      });
    return documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        if (currentState.reference) throw Errors.invalidOperation; // Readonly field
        return save([{
          type: 'DocumentReferenceDefined',
          payload: { documentId, userId, reference, timestamp }
        }]);
      });
  },
  DefineDocumentLink: async ({
    userId,
    payload: { documentId, link, timestamp }
  }) => {
    await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => {
        if (!currentState) throw Errors.insufficientPrivilege;
      });
    return documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([{
          type: 'DocumentLinkDefined',
          payload: { documentId, userId, link, timestamp }
        }]);
      });
  },
  DefineDocumentLoanId: async ({
    userId,
    payload: { documentId, loanId, timestamp }
  }) => {
    await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => {
        if (!currentState) throw Errors.insufficientPrivilege;
      });
    return documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([{
          type: 'DocumentLoanIdDefined',
          payload: { documentId, userId, loanId, timestamp }
        }]);
      });
  },
  DefineDocumentTitle: async ({
    userId,
    payload: { documentId, title, timestamp }
  }) => {
    await userRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState }) => {
        if (!currentState) throw Errors.insufficientPrivilege;
      });
    return documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([{
          type: 'DocumentTitleDefined',
          payload: { documentId, userId, title, timestamp }
        }]);
      });
  }
});
