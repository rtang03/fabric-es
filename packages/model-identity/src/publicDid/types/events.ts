import type { BaseEvent } from '@fabric-es/fabric-cqrs';
import type { DidDocument } from './didDocument';

export interface DidDocumentCreated extends BaseEvent {
  readonly type: 'DidDocumentCreated';
  payload: DidDocument;
}

export interface DidDocumentRead extends BaseEvent {
  readonly type: 'DidDocumentRead';
  payload: {
    id: string;
  };
}

export interface ControllerUpdated extends BaseEvent {
  readonly type: 'ControllerUpdated';
  payload: {
    controller: string;
  };
}

// see example https://github.com/decentralized-identity/ethr-did-resolver
export interface VerificationMethodAdded extends BaseEvent {
  readonly type: 'VerificationMethodAdded';
  //  Secp256k1 Verification Key
  payload: {
    name: 'did/pub/Secp256k1/veriKey/hex';
    type: 'Secp256k1VerificationKey2018';
    controller: string;
    value: string;
  };
}

export interface VerificationMethodRemoved extends BaseEvent {
  readonly type: 'VerificationMethodRemoved';
  //  Secp256k1 Verification Key
  payload: {
    name: 'did/pub/Secp256k1/veriKey/hex';
    type: 'Secp256k1VerificationKey2018';
    controller: string;
  };
}

export interface ServiceEndpointAdded extends BaseEvent {
  readonly type: 'ServiceEndpointAdded';
  payload: {
    name: 'did/svc/Corpservice';
    type: 'CorpService';
    controller: string;
    value: string;
  };
}

export interface ServiceEndpointRemoved extends BaseEvent {
  readonly type: 'ServiceEndpointRemoved';
  payload: {
    name: 'did/svc/Corpservice';
    type: 'CorpService';
    controller: string;
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
  | DidDocumentRead
  | ControllerUpdated
  | DidDocumentDeactivated
  | VerificationMethodAdded
  | VerificationMethodRemoved
  | ServiceEndpointAdded
  | ServiceEndpointRemoved;
