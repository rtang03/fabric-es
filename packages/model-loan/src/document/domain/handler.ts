import { Errors } from '@espresso/model-common';
import { DocumentCommandHandler, DocumentRepo } from '..';

export const DocumentErrors = {
  documentNotFound: documentId =>
    new Error(`DOCUMENT_NOT_FOUND: id: ${documentId}`),
  documentCancelled: () => new Error('DOCUMENT_CANCELLED'),
  documentApproved: () => new Error('DOCUMENT_APPROVED')
};

export const documentCommandHandler: (option: {
  enrollmentId: string;
  documentRepo: DocumentRepo;
}) => DocumentCommandHandler = ({ enrollmentId, documentRepo }) => ({
  CreateDocument: async ({
    userId,
    payload: { documentId, loanId, title, reference, timestamp }
  }) => {
    if (!reference) throw Errors.requiredDataMissing();
    const events: any = [
      { type: 'DocumentCreated', payload: { documentId, userId, timestamp } },
      {
        type: 'DocumentReferenceDefined',
        payload: { documentId, userId, reference, timestamp }
      }
    ];
    if (loanId)
      events.push({
        type: 'DocumentLoanIdDefined',
        payload: { documentId, userId, loanId, timestamp }
      });
    if (title)
      events.push({
        type: 'DocumentTitleDefined',
        payload: { documentId, userId, title, timestamp }
      });
    return documentRepo.create({ enrollmentId, id: documentId }).save(events);
  },
  DeleteDocument: async ({ userId, payload: { documentId, timestamp } }) =>
    documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([
          {
            type: 'DocumentDeleted',
            payload: { documentId, userId, timestamp }
          }
        ]);
      }),
  RestrictDocumentAccess: async ({
    userId,
    payload: { documentId, timestamp }
  }) =>
    documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([
          {
            type: 'DocumentRestricted',
            payload: { documentId, userId, timestamp }
          }
        ]);
      }),
  DefineDocumentReference: async _ => {
    throw Errors.invalidOperation(); // Readonly field
  },
  DefineDocumentLoanId: async ({
    userId,
    payload: { documentId, loanId, timestamp }
  }) =>
    documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([
          {
            type: 'DocumentLoanIdDefined',
            payload: { documentId, userId, loanId, timestamp }
          }
        ]);
      }),
  DefineDocumentTitle: async ({
    userId,
    payload: { documentId, title, timestamp }
  }) =>
    documentRepo
      .getById({ enrollmentId, id: documentId })
      .then(({ currentState, save }) => {
        if (!currentState) throw DocumentErrors.documentNotFound(documentId);
        return save([
          {
            type: 'DocumentTitleDefined',
            payload: { documentId, userId, title, timestamp }
          }
        ]);
      })
});
