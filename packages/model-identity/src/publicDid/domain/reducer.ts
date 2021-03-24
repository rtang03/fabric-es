import omit from 'lodash/omit';
import type { DidDocument } from '../../types';
import type { DidDocumentEvents } from '../types';

export const didDocumentReducer: (
  didDocument: DidDocument,
  event: DidDocumentEvents
) => DidDocument = (doc, event) => {
  switch (event.type) {
    case 'DidDocumentCreated':
      const id = event.payload.id.replace('did:fab:', '');
      return Object.assign({}, event.payload, { id });
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
