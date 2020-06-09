import { Commit } from './commit';

export interface PubSubPayload {
  entityAdded: {
    commit: Commit;
    events: string[];
    key: string;
  };
}

export interface PubSubSysEvent {
  systemEvent: {
    event: string;
    data?: any;
    message?: string;
    status?: string;
    error?: string;
    timestamp: number;
  };
}
