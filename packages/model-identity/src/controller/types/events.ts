import type { BaseEvent } from '@fabric-es/fabric-cqrs';

export interface ControllerCreated extends BaseEvent {
  readonly type: 'ControllerCreated';
  payload: {
    id: string;
    did: string;
  };
}

export interface DidAdded extends BaseEvent {
  readonly type: 'DidAdded';
  payload: {
    did: string;
  };
}

export interface DidRemoved extends BaseEvent {
  readonly type: 'DidRemoved';
  payload: {
    did: string;
  };
}

export type ControllerEvents = ControllerCreated | DidAdded | DidRemoved;
