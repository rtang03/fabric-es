import type { DidDocument } from '../../types';
import type { DidDocumentEvents } from '../types';

export const didDocumentReducer: (
  didDocument: DidDocument,
  event: DidDocumentEvents
) => DidDocument = (did, event) => {
  switch (event.type) {
    case 'DidDocumentCreated':
      return event.payload;
    case 'VerificationMethodAdded':
      // the pre-existing / duplicated VerificationMethod is replaced by new one.
      const vm = did.verificationMethod.filter((item) => item.id !== event.payload.id);
      return {
        ...did,
        verificationMethod: [...vm, event.payload],
      };
    case 'VerificationMethodRemoved':
      return {
        ...did,
        verificationMethod: did.verificationMethod.filter((item) => item.id !== event.payload.id),
      };
    case 'ServiceEndpointAdded':
      // the pre-existing / duplicated service is replaced by new one.
      const ep = did.service.filter((item) => item.id !== event.payload.id);

      return { ...did, service: [...ep, event.payload] };
    case 'ServiceEndpointRemoved':
      return { ...did, service: did.service.filter((item) => item.id !== event.payload.id) };
    case 'DidDocumentDeactivated':
      return did;
    default:
      return did;
  }
};
