import { Commit } from './commit';

export interface PubSubPayload {
  entityAdded: {
    commit: Commit;
    events: string[];
    key: string;
  };
}
