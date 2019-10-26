import { BaseEvent } from '@espresso/fabric-cqrs';

export interface EtcPoCreated extends BaseEvent {
  readonly type: 'EtcPoCreated';
  payload: {
    id: string;
    ownerId: string;
    timestamp: number;
  };
}

export interface EtcPoBodyUpdated extends BaseEvent {
  readonly type: 'EtcPoBodyUpdated';
  payload: {
    id: string;
    body: string;
    timestamp: number;
  };
}

export type EtcPoEvent = EtcPoCreated | EtcPoBodyUpdated;
