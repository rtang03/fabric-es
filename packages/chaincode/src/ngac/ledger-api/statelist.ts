import { Context } from 'fabric-contract-api';
import { Policy, Resource } from '../types';

const serialize = object => Buffer.from(JSON.stringify(object));

const stateList: (
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
      stub.createCompositeKey(name, item.key.split(':')),
      serialize(item)
    ),
  getState: async key => {
    const data = await stub.getState(
      stub.createCompositeKey(name, key.split(':'))
    );
    return data.toString() ? JSON.parse(data.toString()) : {};
  },
  deleteStateByKey: async key =>
    await stub.deleteState(stub.createCompositeKey(name, key.split(':')))
});

export default stateList;
