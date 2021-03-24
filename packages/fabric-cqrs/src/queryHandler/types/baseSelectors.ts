import { createStructuredSelector, Selector } from 'reselect';

export const basePreSelector: Selector<any, any> = createStructuredSelector({
  ts: ([{ _ts }]) => _ts,
  created: ([{ _created }]) => _created,
  creator: ([{ _creator }]) => _creator,
  organ: ([{ _organization }]) => JSON.stringify(_organization),
});

export const basePostSelector: Selector<any, any> = createStructuredSelector({
  timestamp: (item) => item?.ts,
  createdAt: (item) => item?.created,
  creator: (item) => item?.creator,
  organization: (item) => JSON.parse(item?.organ),
});
