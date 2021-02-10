import { BaseEvent } from '../types';

/**
 * add metadata - creation timestamp
 * @ignore
 */
export const addCreatedAt: (events: BaseEvent[]) => BaseEvent[] = (events) => {
  const currentTime = Math.round(new Date().getTime());

  return events.map((event) => ({
    ...event,
    payload: Object.assign({}, event.payload, {
      _created: currentTime,
      _ts: currentTime,
    }),
  }));
};
