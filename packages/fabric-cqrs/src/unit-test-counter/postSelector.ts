import { createStructuredSelector, Selector } from 'reselect';
import type { CounterInRedis, OutputCounter } from './types';

/**
 * @about transform from [[CounterInRedis]] to [[OutputCounter]]
 * @ignore
 */
export const postSelector: Selector<CounterInRedis, OutputCounter> = createStructuredSelector({
  description: (item) => item?.de,
  eventInvolved: (item) => item?.event.split(','),
  id: (item) => item?.id,
  tags: (item) => item?.tag.split(','),
  value: (item) => parseInt(item?.val as string, 10),
});
