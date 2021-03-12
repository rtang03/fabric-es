import type { Commit } from '@fabric-es/fabric-cqrs';
import { createStructuredSelector, Selector } from 'reselect';
import type { DidDocument, DidDocumentInRedis } from '../types';

export const didDocumentPreSelector: Selector<
  [DidDocument, Commit[]],
  DidDocumentInRedis
> = createStructuredSelector({
  verification: ([{ verificationMethod }]) => JSON.stringify(verificationMethod),
  context: ([didDocument]) => JSON.stringify({ value: didDocument['context'] }),
  controller: ([{ controller }]) => controller,
  created: ([{ _created }]) => _created.toString(),
  id: ([{ id }]) => id,
  keyagr: ([{ keyAgreement }]) => JSON.stringify(keyAgreement),
  proof: ([{ proof }]) => JSON.stringify(proof),
  service: ([{ service }]) => JSON.stringify(service),
  updated: ([{ _ts }]) => _ts.toString(),
  ts: ([{ _ts }]) => _ts,
});
