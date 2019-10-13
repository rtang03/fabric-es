import { Context } from 'fabric-contract-api';
import { Attribute, Policy, Resource } from '../types';
import { splitKey } from '../utils';

const serialize = object => Buffer.from(JSON.stringify(object));

const stateList: <T extends Resource | Attribute | Policy = any>(
  name: string,
  context: Context
) => {
  getQueryResult: (keyparts: string[]) => Promise<T[]>;
  addState: (item: T) => void;
  getState: (key: string) => Promise<T>;
  deleteStateByKey: any;
} = <T extends Attribute | Resource | Policy = any>(name, { stub }) => ({
  getQueryResult: async keyparts => {
    const iterator = await stub.getStateByPartialCompositeKey(name, keyparts);
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
  addState: async item =>
    await stub.putState(
      stub.createCompositeKey(name, splitKey(item.key)),
      serialize(item)
    ),
  getState: async key => {
    const data = await stub.getState(
      stub.createCompositeKey(name, splitKey(key))
    );
    return data.toString() ? JSON.parse(data.toString()) : {};
  },
  deleteStateByKey: async key =>
    await stub.deleteState(stub.createCompositeKey(name, splitKey(key)))
});

export default stateList;
