import { Errors } from '@espresso/model-common';
import { documentCommandHandler as superCommandHandler, DocumentErrors } from '@espresso/model-loan';
import { DocumentCommandHandler, DocumentRepo } from '.';

export const documentCommandHandler: (option: {
  enrollmentId: string;
  documentRepo: DocumentRepo;
}) => DocumentCommandHandler = ({ enrollmentId, documentRepo }) => ({
  ...superCommandHandler({ enrollmentId, documentRepo }),
  CreateDocument: async ({ userId, payload: { documentId, loanId, title, reference, link, timestamp } }) => {
    if (!reference) throw Errors.requiredDataMissing();
    const events: any = [
      { type: 'DocumentCreated', payload: { documentId, userId, timestamp } },
      { type: 'DocumentReferenceDefined', payload: { documentId, userId, reference, timestamp } },
      { type: 'DocumentLinkDefined', payload: { documentId, userId, link, timestamp } }
    ];
    if (loanId) events.push({ type: 'DocumentLoanIdDefined', payload: { documentId, userId, loanId, timestamp } });
    if (title) events.push({ type: 'DocumentTitleDefined', payload: { documentId, userId, title, timestamp } });
    return documentRepo.create({ enrollmentId, id: documentId }).save(events);
  },
  DefineDocumentLink: async ({ userId, payload: { documentId, link, timestamp } }) =>
    documentRepo.getById({ enrollmentId, id: documentId }).then(({ currentState, save }) => {
      if (!currentState) throw DocumentErrors.documentNotFound(documentId);
      return save([
        {
          type: 'DocumentLinkDefined',
          payload: { documentId, userId, link, timestamp }
        }
      ]);
    })
});
