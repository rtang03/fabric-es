import assign from 'lodash/assign';
import { BaseEvent } from '../types';

export const addCreator: (events: BaseEvent[], enrollmentId) => BaseEvent[] = (
  events,
  enrollmentId
) =>
  events.map((event) => ({
    ...event,
    payload: assign({}, event.payload, { _creator: enrollmentId }),
  }));