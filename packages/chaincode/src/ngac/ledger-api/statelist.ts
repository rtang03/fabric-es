import { Context } from 'fabric-contract-api';
import { Attribute, Policy, Resource } from '../types';
import { splitKey } from '../utils';

const serialize = object => Buffer.from(JSON.stringify(object));

const stateList: <T extends Attribute | Attribute[] | Resource | Policy = any>(
  namespace: string,
  context: Context
) => {
  getQueryResult: (keyparts: string[]) => Promise<T[]>;
  addState: (key: string, item: T) => Promise<T>;
  getState: (key: string) => Promise<T>;
  deleteStateByKey: (key: string) => Promise<string>;
  deleteStatesByKeyRange: (keyparts: string[]) => Promise<string[]>;
} = <T extends Attribute | Attribute[] | Resource | Policy = any>(
  namespace,
  { stub }
) => ({
  getQueryResult: async keyparts => {
    const iterator = await stub.getStateByPartialCompositeKey(
      namespace,
      keyparts
    );
    const result: T[] = [];
    while (true) {
      const { value, done } = await iterator.next();
      if (value && value.value.toString()) {
        const json: T = JSON.parse((value.value as Buffer).toString('utf8'));
        result.push(json);
      }
      if (done) {
        await iterator.close();
        return result;
      }
    }
  },
  addState: async (key, item) => {
    await stub.putState(
      stub.createCompositeKey(namespace, splitKey(key)),
      serialize(item)
    );
    return item;
  },
  getState: async key => {
    const data = await stub.getState(
      stub.createCompositeKey(namespace, splitKey(key))
    );
    return data.toString() ? JSON.parse(data.toString()) : {};
  },
  deleteStateByKey: async key =>
    await stub.deleteState(stub.createCompositeKey(namespace, splitKey(key))),
  deleteStatesByKeyRange: async keyparts => {
    const iterator = await stub.getStateByPartialCompositeKey(
      namespace,
      keyparts
    );
    const result = [];
    while (true) {
      const { value, done } = await iterator.next();
      if (value && value.value.toString()) {
        const item = JSON.parse((value.value as Buffer).toString('utf8'));
        await stub.deleteState(
          stub.createCompositeKey(namespace, splitKey(item.key))
        );
        result.push(item.key);
      } else return [];

      if (done) {
        await iterator.close();
        return result;
      }
    }
  }
});

export default stateList;
