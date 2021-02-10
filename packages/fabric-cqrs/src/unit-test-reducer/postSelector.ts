import { createStructuredSelector, Selector } from 'reselect';
import type { CounterInRedis, OutputCounter } from './types';

/**
 * @about transform from [[CounterInRedis]] to [[OutputCounter]]
 * do not use destructor for item
 */
export const postSelector: Selector<CounterInRedis, OutputCounter> = createStructuredSelector({
  createdAt: (item) => item?.created && new Date(item?.created * 1000).toISOString(),
  creator: (item) => item?.creator,
  description: (item) => item?.de,
  eventInvolved: (item) => item?.event.split(','),
  id: (item) => item?.id,
  tags: (item) => item?.tag.split(','),
  timestamp: (item) => item?.ts && new Date(item?.ts * 1000).toISOString(),
  value: (item) => parseInt(item?.val as string, 10),
});
