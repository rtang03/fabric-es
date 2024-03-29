import omit from 'lodash/omit';
import type { PrivateDidDocument, PrivateDidDocEvents } from '../types';

export const privateDidDocReducer: (
  doc: PrivateDidDocument,
  event: PrivateDidDocEvents
) => PrivateDidDocument = (doc, event) => {
  switch (event.type) {
    case 'DidDocumentCreated':
      return event.payload;
    case 'VerificationMethodAdded':
      // the pre-existing / duplicated VerificationMethod is replaced by new one.
      const vm = doc.verificationMethod.filter((item) => item.id !== event.payload.id);
      return {
        ...doc,
        verificationMethod: [...vm, event.payload],
      };
    case 'VerificationMethodRemoved':
      return {
        ...doc,
        verificationMethod: doc.verificationMethod.filter((item) => item.id !== event.payload.id),
      };
    case 'ServiceEndpointAdded':
      // the pre-existing / duplicated service is replaced by new one.
      const ep = doc.service.filter((item) => item.id !== event.payload.id);

      return { ...doc, service: [...ep, event.payload] };
    case 'ServiceEndpointRemoved':
      return { ...doc, service: doc.service.filter((item) => item.id !== event.payload.id) };
    case 'DidDocumentDeactivated':
      return omit(doc, 'verificationMethod');
    default:
      return doc;
  }
};
