import type { BaseEvent } from '@fabric-es/fabric-cqrs';
import type { Credential } from './credential';

export interface CredentialIssued extends BaseEvent {
  readonly type: 'CredentialIssued';
  payload: any;
}

export interface CredentialDerived extends BaseEvent {
  readonly type: 'CredentialDerived';
  payload: any;
}

export interface CredentialStatusUpdated extends BaseEvent {
  readonly type: 'CredentialStatusUpdated';
  payload: any;
}

export interface PresentationProved extends BaseEvent {
  readonly type: 'PresentationProved';
  payload: any;
}

export interface CredentialVerified extends BaseEvent {
  readonly type: 'CredentialVerified';
  payload: any;
}

export interface PresentationVerified extends BaseEvent {
  readonly type: 'PresentationVerified';
  payload: any;
}

export type CredentialEvents =
  | CredentialIssued
  | CredentialDerived
  | CredentialStatusUpdated
  | PresentationProved
  | CredentialVerified
  | PresentationVerified;
