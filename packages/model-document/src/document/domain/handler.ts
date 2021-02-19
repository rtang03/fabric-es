import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { Errors } from '@fabric-es/gateway-lib';
import type { DocumentCommandHandler, DocumentEvents, DocumentRepo } from '../types';

export const DocumentErrors = {
  documentNotFound: (documentId) => new Error(`DOCUMENT_NOT_FOUND: id: ${documentId}`),
  documentCancelled: () => new Error('DOCUMENT_CANCELLED'),
  documentApproved: () => new Error('DOCUMENT_APPROVED'),
};

export const documentCommandHandler: (option: {
  enrollmentId: string;
  documentRepo: DocumentRepo;
}) => DocumentCommandHandler = ({ enrollmentId, documentRepo }) => ({
  CreateDocument: async ({
    userId,
    payload: { documentId, loanId, title, reference, timestamp },
  }) => {
    if (!reference) throw Errors.requiredDataMissing();
    const events: DocumentEvents[] = [
      {
        type: 'DocumentCreated',
        lifeCycle: Lifecycle.BEGIN,
        payload: { documentId, userId, timestamp },
      },
      { type: 'DocumentReferenceDefined', payload: { documentId, userId, reference, timestamp } },
    ];
    if (loanId)
      events.push({
        type: 'DocumentLoanIdDefined',
        payload: { documentId, userId, loanId, timestamp },
      });
    if (title)
      events.push({
        type: 'DocumentTitleDefined',
        payload: { documentId, userId, title, timestamp },
      });
    return documentRepo
      .create({ enrollmentId, id: documentId })
      .save({ events })
      .then(({ data }) => data);
  },
  DeleteDocument: async ({ userId, payload: { documentId, timestamp } }) =>
    documentRepo.getById({ enrollmentId, id: documentId }).then(({ currentState, save }) => {
      if (!currentState) throw DocumentErrors.documentNotFound(documentId);
      return save({
        events: [
          {
            type: 'DocumentDeleted',
            lifeCycle: Lifecycle.END,
            payload: { documentId, userId, timestamp },
          },
        ],
      }).then(({ data }) => data);
    }),
  RestrictDocumentAccess: async ({ userId, payload: { documentId, timestamp } }) =>
    documentRepo.getById({ enrollmentId, id: documentId }).then(({ currentState, save }) => {
      if (!currentState) throw DocumentErrors.documentNotFound(documentId);
      return save({
        events: [
          {
            type: 'DocumentRestricted',
            payload: { documentId, userId, timestamp },
          },
        ],
      }).then(({ data }) => data);
    }),
  DefineDocumentReference: async (_) => {
    throw Errors.invalidOperation(); // Readonly field
  },
  DefineDocumentLoanId: async ({ userId, payload: { documentId, loanId, timestamp } }) =>
    documentRepo.getById({ enrollmentId, id: documentId }).then(({ currentState, save }) => {
      if (!currentState) throw DocumentErrors.documentNotFound(documentId);
      return save({
        events: [
          {
            type: 'DocumentLoanIdDefined',
            payload: { documentId, userId, loanId, timestamp },
          },
        ],
      }).then(({ data }) => data);
    }),
  DefineDocumentTitle: async ({ userId, payload: { documentId, title, timestamp } }) =>
    documentRepo.getById({ enrollmentId, id: documentId }).then(({ currentState, save }) => {
      if (!currentState) throw DocumentErrors.documentNotFound(documentId);
      return save({
        events: [
          {
            type: 'DocumentTitleDefined',
            payload: { documentId, userId, title, timestamp },
          },
        ],
      }).then(({ data }) => data);
    }),
});
