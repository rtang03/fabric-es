import { BaseEvent, CREATED_FIELD, TS_FIELD } from '../types';

/**
 * add metadata - creation timestamp
 * @ignore
 */
export const addCreatedAt: (events: BaseEvent[]) => BaseEvent[] = (events) => {
  const currentTime = Math.round(new Date().getTime());

  return events.map((event) => ({
    ...event,
    payload: Object.assign({}, event.payload, {
      [CREATED_FIELD]: currentTime,
      [TS_FIELD]: currentTime,
    }),
  }));
};
