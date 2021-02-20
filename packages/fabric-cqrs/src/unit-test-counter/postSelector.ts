import { createStructuredSelector, Selector } from 'reselect';
import type { CounterInRedis, OutputCounter } from './types';

/**
 * @about transform from [[CounterInRedis]] to [[OutputCounter]]
 * @ignore
 */
export const postSelector: Selector<CounterInRedis, OutputCounter> = createStructuredSelector({
  createdAt: (item) => item?.created,
  creator: (item) => item?.creator,
  description: (item) => item?.de,
  eventInvolved: (item) => item?.event.split(','),
  id: (item) => item?.id,
  tags: (item) => item?.tag.split(','),
  timestamp: (item) => item?.ts,
  value: (item) => parseInt(item?.val as string, 10),
});
