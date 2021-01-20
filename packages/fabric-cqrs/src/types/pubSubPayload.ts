import { Commit } from './commit';

/**
 * @about payload fired when entity is added to Redis
 */
export type PubSubPayload = {
  entityAdded: {
    commit: Commit;
    events: string[];
    key: string;
  };
};

/**
 * @about system event when Redis PubSub event is sent
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
};
