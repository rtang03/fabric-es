import { BaseEvent, TS_FIELD } from '../types';

/**
 * add metadata - timestamp
 * @ignore
 */
export const addTimestamp: (events: BaseEvent[]) => BaseEvent[] = (events) => {
  const currentTime = Math.round(new Date().getTime());

  return events.map((event) => ({
    ...event,
    payload: Object.assign({}, event.payload, { [TS_FIELD]: currentTime }),
  }));
};
