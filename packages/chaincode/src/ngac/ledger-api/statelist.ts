import { Context } from 'fabric-contract-api';

const splitKey = (key: string) => key.split(':');

const makeKey = (keyParts: any[]) =>
  keyParts.map(part => JSON.stringify(part)).join(':');

const serialize = object => Buffer.from(JSON.stringify(object));

const stateList: (
  name: string,
  context: Context
) => {
  getQueryResult: (attributes: string[]) => Promise<any>;
  addState: any;
  getState: any;
  deleteStateByKey: any;
} = (name, { stub }) => ({
  getQueryResult: async keyparts => {
    const iterator = await stub.getStateByPartialCompositeKey(name, keyparts);
    const result = {};
    while (true) {
      const { value, done } = await iterator.next();
      if (value && value.value.toString()) {
        const json = JSON.parse((value.value as Buffer).toString('utf8'));
        result[json.uri] = json;
      }
      if (done) {
        await iterator.close();
        return result;
      }
    }
  },
  addState: async json =>
    await stub.putState(
      stub.createCompositeKey(name, splitKey(json.uri)),
      serialize(json)
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
