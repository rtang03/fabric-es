import { NAMESPACE as NS, Policy, Resource } from '../../types';
import { splitKey } from '../../utils';

const noResult = Promise.resolve([]);
const createKey = (keyparts: string[]) =>
  keyparts.reduce((pre, cur) => pre + cur, '');

const stateList = (
  namespace: string,
  { mspAttributeDb: mspDb, resourceAttributeDb: resDb, policyDb }
) => ({
  getQueryResult: async (keyparts: string[]) =>
    ({
      [NS.RESOURCE_ATTRIBUTE]: () => resDb[createKey(keyparts)] || noResult,
      [NS.POLICY]: () => policyDb[keyparts[0]] || noResult
    }[namespace]()),
  getState: async id => {
    const key = createKey(splitKey(id));
    return {
      [NS.MSP_ATTRIBUTE]: () => mspDb[key] || noResult,
      [NS.POLICY]: () => policyDb[key] || noResult
    }[namespace]();
  },
  addState: async (item: any) => {
    const key = createKey(splitKey(item.key));
    return {
      [NS.RESOURCE_ATTRIBUTE]: () => (resDb[key] = Promise.resolve(item)),
      [NS.MSP_ATTRIBUTE]: () => (mspDb[key] = Promise.resolve(item)),
      [NS.POLICY]: () => (policyDb[key] = Promise.resolve(item))
    }[namespace]();
  },
  deleteStateByKey: async key => null
});

export default stateList;
