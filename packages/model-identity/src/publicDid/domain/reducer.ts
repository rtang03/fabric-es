import type { DidDocument, DidDocumentEvents } from '../types';

export const didDocumentReducer: (
  didDocument: DidDocument,
  event: DidDocumentEvents
) => DidDocument = (did, event) => {
  switch (event.type) {
    case 'DidDocumentCreated':
      return event.payload;
    case 'ControllerUpdated':
      return {
        ...did,
        controller: event.payload.controller,
      };
    default:
      return did;
  }
};
