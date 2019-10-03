import { filter, includes, keys } from 'lodash';
import { Context, Effect, Policy, PolicyRepo } from './types';

export const getPolicyRepo: (policies, context: Context) => PolicyRepo = (
  policies,
  { orgName, userId }
) => ({
  addOne: null,
  findByKey: null,
  removeOne: null,
  merge: null,
  request: async ({ action, resource }) =>
    new Promise<Effect>(resolve =>
      filter(policies, policy => includes(policy.action, action))
        .map(({ resourceAttr }) =>
          keys(resourceAttr).reduce(
            (prev, curr) => prev && resourceAttr[curr] === resource[curr],
            true
          )
        )
        .reduce((prev, curr) => prev && curr, true)
        ? resolve('Allow')
        : resolve('Deny')
    )
});
