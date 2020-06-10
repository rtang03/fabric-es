import { BaseEvent, Lifecycle } from '@fabric-es/fabric-cqrs';

export interface UserCreated extends BaseEvent {
  readonly type: 'UserCreated';
  readonly lifeCycle: Lifecycle.BEGIN;
  payload: {
    userId: string;
    mspId: string;
    timestamp: number;
  };
}

export interface UserDeleted extends BaseEvent {
  readonly type: 'UserDeleted';
  readonly lifeCycle: Lifecycle.END;
  payload: {
    userId: string;
    timestamp: number;
  };
}

export interface UserNameDefined extends BaseEvent {
  readonly type: 'UserNameDefined';
  payload: {
    userId: string;
    name: string;
    timestamp: number;
  };
}

export interface UserEndorsed extends BaseEvent {
  readonly type: 'UserEndorsed';
  payload: {
    userId: string;
    endorsedId: string;
    timestamp: number;
  };
}

export type UserEvents = UserCreated | UserDeleted | UserNameDefined | UserEndorsed;
