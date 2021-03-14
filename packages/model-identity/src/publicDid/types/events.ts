import type { BaseEvent } from '@fabric-es/fabric-cqrs';
import type { DidDocument } from '../../types';

export interface DidDocumentCreated extends BaseEvent {
  readonly type: 'DidDocumentCreated';
  payload: DidDocument;
}

// see example https://github.com/decentralized-identity/ethr-did-resolver
export interface VerificationMethodAdded extends BaseEvent {
  readonly type: 'VerificationMethodAdded';
  payload: {
    type: 'Secp256k1VerificationKey2018' | string;
    id: string;
    controller: string;
    publicKeyHex: string;
  };
}

export interface VerificationMethodRemoved extends BaseEvent {
  readonly type: 'VerificationMethodRemoved';
  //  Secp256k1 Verification Key
  payload: {
    id: string;
  };
}

export interface ServiceEndpointAdded extends BaseEvent {
  readonly type: 'ServiceEndpointAdded';
  payload: {
    // serviceId: 'did/svc/Corpservice';
    id: string;
    // type: 'CorpService';
    type: string;
    serviceEndpoint: string;
  };
}

export interface ServiceEndpointRemoved extends BaseEvent {
  readonly type: 'ServiceEndpointRemoved';
  payload: {
    id: string;
  };
}

export interface DidDocumentDeactivated extends BaseEvent {
  readonly type: 'DidDocumentDeactivated';
  payload: {
    id: string;
  };
}

export type DidDocumentEvents =
  | DidDocumentCreated
  | DidDocumentDeactivated
  | VerificationMethodAdded
  | VerificationMethodRemoved
  | ServiceEndpointAdded
  | ServiceEndpointRemoved;
