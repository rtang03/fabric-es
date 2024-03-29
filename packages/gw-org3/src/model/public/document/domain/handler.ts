import { Errors } from '@fabric-es/gateway-lib';
import {
  documentCommandHandler as superCommandHandler,
  DocumentErrors,
} from '@fabric-es/model-document';
import { DocumentCommandHandler, DocumentRepo } from '.';

export const documentCommandHandler: (option: {
  enrollmentId: string;
  documentRepo: DocumentRepo;
}) => DocumentCommandHandler = ({ enrollmentId, documentRepo }) => ({
  ...superCommandHandler({ enrollmentId, documentRepo }),
  CreateDocument: async ({
    userId,
    payload: { documentId, loanId, title, reference, link, timestamp },
  }) => {
    if (!reference) throw Errors.requiredDataMissing();
    if (!link) throw Errors.requiredDataMissing();

    const events: any = [
      { type: 'DocumentCreated', payload: { documentId, userId, timestamp } },
      { type: 'DocumentReferenceDefined', payload: { documentId, userId, reference, timestamp } },
      { type: 'DocumentLinkDefined', payload: { documentId, userId, link, timestamp } },
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
  DefineDocumentLink: async ({ userId, payload: { documentId, link, timestamp } }) =>
    documentRepo.getById({ enrollmentId, id: documentId }).then(({ currentState, save }) => {
      if (!currentState) throw DocumentErrors.documentNotFound(documentId);
      if (!link) throw Errors.requiredDataMissing();

      return save({
        events: [
          {
            type: 'DocumentLinkDefined',
            payload: { documentId, userId, link, timestamp },
          },
        ],
      }).then(({ data }) => data);
    }),
});
