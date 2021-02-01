import { createStructuredSelector, Selector } from 'reselect';
import type { CounterInRedis, OutputCounter } from './types';

/**
 * @about transform from [[CounterInRedis]] to [[OutputCounter]]
 */
export const postSelector: Selector<CounterInRedis, OutputCounter> = createStructuredSelector({
  createdAt: ({ created }) => new Date(created).toISOString(),
  creator: ({ creator }) => creator,
  description: ({ de }) => de,
  eventInvolved: ({ event }) => event.split(','),
  id: ({ id }) => id,
  tags: ({ tag }) => tag.split(','),
  timestamp: ({ ts }) => new Date(ts).toISOString(),
  value: ({ val }) => val,
});
