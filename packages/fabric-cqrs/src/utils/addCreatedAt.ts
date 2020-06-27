import { BaseEvent } from '../types';

export const addCreatedAt: (events: BaseEvent[]) => BaseEvent[] = (events) => {
  const currentTime = Math.round(new Date().getTime() / 1000);

  return events.map((event) => ({
    ...event,
    payload: Object.assign({}, event.payload, {
      _created: currentTime,
      _ts: currentTime,
    }),
  }));
};
