import type { BaseEvent } from '@fabric-es/fabric-cqrs';

export interface IdentifierCreated extends BaseEvent {
  readonly type: 'IdentifierCreated';
  payload: { id: string; type: string; ownerId: string };
}

export interface IdentifierActivated extends BaseEvent {
  readonly type: 'IdentifierActivated';
  payload: {
    activated: boolean;
  };
}

export interface IdentifierDeactivated extends BaseEvent {
  readonly type: 'IdentifierDeactivated';
  payload: {
    activated: boolean;
  };
}

export interface AttributeAdded extends BaseEvent {
  readonly type: 'AttributeAdded';
  payload: {
    key: string;
    value: string;
    description?: string;
  };
}

export interface AttributeRemoved extends BaseEvent {
  readonly type: 'AttributeRemoved';
  payload: { key: string };
}

export type IdentifierEvents =
  | IdentifierCreated
  | IdentifierActivated
  | IdentifierDeactivated
  | AttributeAdded
  | AttributeRemoved;
