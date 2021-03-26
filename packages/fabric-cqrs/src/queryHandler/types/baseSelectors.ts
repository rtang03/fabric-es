import { createStructuredSelector, Selector } from 'reselect';

export const basePreSelector: Selector<any, any> = createStructuredSelector({
  ts: ([{ _ts }]) => _ts,
  created: ([{ _created }]) => _created,
  creator: ([{ _creator }]) => _creator,
  organization: ([{ _organization }]) => JSON.stringify(_organization),
  privateData: ([{ _privateData }]) => JSON.stringify(_privateData),
});

export const basePostSelector: Selector<any, any> = createStructuredSelector({
  modifiedAt: (item) => item?.ts,
  createdAt: (item) => item?.created,
  creator: (item) => item?.creator,
  organization: (item) =>
    (item && item.organization) ? JSON.parse(item?.organization) : undefined,
  privateData: (item) =>
    (item && item.privateData) ? JSON.parse(item?.privateData) : undefined,
});
