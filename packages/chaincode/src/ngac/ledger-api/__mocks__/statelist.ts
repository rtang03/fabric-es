import { NAMESPACE, Resource } from '../../types';
import { splitKey } from '../../utils';

const stateList = (
  namespace: string,
  { mspAttributeDb, resourceAttributeDb, policyDb }
) => ({
  getQueryResult: async (keyparts: string[]) =>
    ({
      [NAMESPACE.MSP_ATTRIBUTE]: () =>
        mspAttributeDb[keyparts[0]] || Promise.resolve([]),
      [NAMESPACE.RESOURCE_ATTRIBUTE]: () =>
        resourceAttributeDb[keyparts.reduce((pre, cur) => pre + cur, '')] ||
        Promise.resolve([]),
      [NAMESPACE.POLICY]: () => policyDb[keyparts[0]] || Promise.resolve([])
    }[namespace]()),
  getState: async key =>
    ({
      [NAMESPACE.POLICY]: () =>
        policyDb[splitKey(key).reduce((pre, cur) => pre + cur, '')] ||
        Promise.resolve([])
    }[namespace]()),
  // todo: bug
  addState: async ({ key, resourceAttrs }: Resource) => {
    const id = splitKey(key).reduce((prev, curr) => prev + curr, '');
    resourceAttributeDb[id] = Promise.resolve(resourceAttrs);
  }
});

export default stateList;
