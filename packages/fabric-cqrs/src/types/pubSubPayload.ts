import { Commit } from './commit';

/**
 * Payload fired when entity is added to Redis
 */
export type PubSubPayload = {
  entityAdded: {
    commit: Commit;
    events: string[];
    key: string;
  };
};

/**
 * System event when Redis PubSub event is sent
 */
export type PubSubSysEvent = {
  systemEvent: {
    event: string;
    data?: any;
    message?: string;
    status?: string;
    error?: string;
    timestamp: number;
  };
}
