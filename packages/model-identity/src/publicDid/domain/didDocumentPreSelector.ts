import type { Commit } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { DidDocument } from '../../types';
import type { DidDocumentInRedis } from '../types';

export const didDocumentPreSelector: Selector<
  [DidDocument, Commit[]],
  DidDocumentInRedis
> = createStructuredSelector({
  publickey: ([{ publicKey }]) => JSON.stringify(publicKey),
  context: ([didDocument]) => JSON.stringify({ value: didDocument['context'] }),
  controller: ([{ controller }]) => controller,
  id: ([{ id }]) => id,
  keyagr: ([{ keyAgreement }]) => JSON.stringify(keyAgreement),
  proof: ([{ proof }]) => JSON.stringify(proof),
  service: ([{ service }]) => JSON.stringify(service),
});
