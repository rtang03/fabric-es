import { BaseEvent } from '../types';

/**
 * add metadata - timestamp
 * @ignore
 */
export const addTimestamp: (events: BaseEvent[]) => BaseEvent[] = (events) => {
  const currentTime = Math.round(new Date().getTime());

  return events.map((event) => ({
    ...event,
    payload: Object.assign({}, event.payload, { _ts: currentTime }),
  }));
};
