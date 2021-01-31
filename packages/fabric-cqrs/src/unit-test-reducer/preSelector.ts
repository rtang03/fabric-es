import { createSelector, OutputSelector } from 'reselect';

export const preSelector: OutputSelector<any, any, any> = createSelector(
  () => null,
  (base) => ({ ...base })
);
