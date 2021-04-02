import omit from 'lodash/omit';
import type { DidDocument } from '../../types';
import { removeDidMethodPrefix } from '../../utils';
import type { DidDocumentEvents } from '../types';

export const didDocumentReducer: (
  didDocument: DidDocument,
  event: DidDocumentEvents
) => DidDocument = (doc, event) => {
  switch (event.type) {
    case 'DidDocumentCreated':
      const id = removeDidMethodPrefix(event.payload.id);
      return Object.assign({}, event.payload, { id });
    case 'VerificationMethodAdded':
      // the pre-existing / duplicated VerificationMethod is replaced by new one.
      const vm = doc.publicKey.filter((item) => item.id !== event.payload.id);
      return {
        ...doc,
        publicKey: [...vm, event.payload],
      };
    case 'VerificationMethodRemoved':
      return {
        ...doc,
        publicKey: doc.publicKey.filter((item) => item.id !== event.payload.id),
      };
    case 'ServiceEndpointAdded':
      // the pre-existing / duplicated service is replaced by new one.
      const ep = doc.service.filter((item) => item.id !== event.payload.id);

      return { ...doc, service: [...ep, event.payload] };
    case 'ServiceEndpointRemoved':
      return { ...doc, service: doc.service.filter((item) => item.id !== event.payload.id) };
    case 'DidDocumentDeactivated':
      return { ...doc, deactivated: true };
    default:
      return doc;
  }
};
