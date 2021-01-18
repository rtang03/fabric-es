import assign from 'lodash/assign';
import { BaseEvent } from '../types';

/**
 * replace invalid character of TAG of Redisearch
 * @ignore
 */
export const replaceTag: (events: BaseEvent[]) => BaseEvent[] = (events) =>
  events.map((event) =>
    event?.payload?.tag
      ? {
          ...event,
          payload: assign(
            {},
            { ...event.payload },
            {
              tag: event.payload.tag
                .replace(/-/g, '_')
                .replace(/:/g, '')
                .replace(/\+/g, '_')
                .replace(/=/g, '')
                .toLowerCase(),
            }
          ),
        }
      : event
  );
