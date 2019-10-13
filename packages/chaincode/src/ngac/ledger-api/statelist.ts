import { Context } from 'fabric-contract-api';
import { Policy, Resource } from '../types';
import { splitKey } from '../utils';

const serialize = object => Buffer.from(JSON.stringify(object));

const stateList: <T extends Resource | Policy = any>(
  name: string,
  context: Context
) => {
  getQueryResult: (attributes: string[]) => Promise<any>;
  addState: any;
  getState: any;
  deleteStateByKey: any;
} = <T extends Resource | Policy = any>(name, { stub }) => ({
  getQueryResult: async (keyparts: string[]) => {
    const iterator = await stub.getStateByPartialCompositeKey(name, keyparts);
    const result = {};
    while (true) {
      const { value, done } = await iterator.next();
      if (value && value.value.toString()) {
        const json = JSON.parse((value.value as Buffer).toString('utf8'));
        result[json.key] = json;
      }
      if (done) {
        await iterator.close();
        return result;
      }
    }
  },
  addState: async (item: T) =>
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
