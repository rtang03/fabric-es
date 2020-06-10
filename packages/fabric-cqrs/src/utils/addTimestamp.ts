import { BaseEvent } from '../types';

export const addTimestamp: (events: BaseEvent[]) => BaseEvent[] = (events) =>
  events.map((event) => ({
    ...event,
    payload: Object.assign({}, event.payload, { ts: Math.round(new Date().getTime() / 1000) }),
  }));
