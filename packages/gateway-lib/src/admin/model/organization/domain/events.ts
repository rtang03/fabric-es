import { BaseEvent } from '@fabric-es/fabric-cqrs';

export interface OrgStarted extends BaseEvent {
  readonly type: 'OrgStarted';
  payload: {
    mspId: string;
    timestamp: number;
    _ts?: number;
    _created?: number;
    _creator?: string;
  };
}

export interface OrgNameDefined extends BaseEvent {
  readonly type: 'OrgNameDefined';
  payload: {
    mspId: string;
    name: string;
    timestamp: number;
    _ts?: number;
    _created?: number;
    _creator?: string;
  };
}

export interface OrgUrlDefined extends BaseEvent {
  readonly type: 'OrgUrlDefined';
  payload: {
    mspId: string;
    url: string;
    timestamp: number;
    _ts?: number;
    _created?: number;
    _creator?: string;
  };
}

export interface OrgDowned extends BaseEvent {
  readonly type: 'OrgDowned';
  payload: {
    mspId: string;
    timestamp: number;
    _ts?: number;
    _created?: number;
    _creator?: string;
  };
}

export type OrgEvents = OrgStarted | OrgNameDefined | OrgUrlDefined | OrgDowned;
