import { documentReducer as superReducer, DocumentStatus } from '@fabric-es/model-document';
import type { Document, DocumentEvents } from '.';

export const documentReducer = (document: Document, event: DocumentEvents): Document => {
  switch (event.type) {
    case 'DocumentCreated':
      return {
        id: event.payload.documentId,
        documentId: event.payload.documentId,
        ownerId: event.payload.userId,
        status: DocumentStatus[event.type],
        timestamp: event.payload.timestamp,
        reference: null,
        link: null,
      };
    case 'DocumentLinkDefined':
      return {
        ...document,
        link: event.payload.link,
      };
    default:
      return superReducer(document, event) as Document;
  }
};
