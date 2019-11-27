import { Document, DocumentEvents, DocumentStatus } from '.';

export function documentReducer(
  history: DocumentEvents[],
  initialState?: Document
): Document {
  const reducer = (document: Document, event: DocumentEvents): Document => {
    switch (event.type) {
      case 'DocumentCreated':
        return {
          documentId: event.payload.documentId,
          ownerId: event.payload.userId,
          status: DocumentStatus[event.type],
          timestamp: event.payload.timestamp,
          reference: null
        };
      case 'DocumentDeleted':
      case 'DocumentRestricted':
        return {
          ...document,
          status: DocumentStatus[event.type]
        };
      case 'DocumentReferenceDefined':
        return {
          ...document,
          reference: event.payload.reference
        };
      case 'DocumentLoanIdDefined':
        return {
          ...document,
          loanId: event.payload.loanId
        };
      case 'DocumentTitleDefined':
        return {
          ...document,
          title: event.payload.title
        };
    }
  };

  return history.reduce(reducer, initialState);
}
