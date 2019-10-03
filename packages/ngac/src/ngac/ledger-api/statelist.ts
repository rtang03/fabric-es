import { Context } from 'fabric-contract-api';

export const splitKey = (key: string) => key.split(':');

export const makeKey = (keyParts: any[]) =>
  keyParts.map(part => JSON.stringify(part)).join(':');

export const serialize = object => Buffer.from(JSON.stringify(object));

export const getStateList: (name: string, context: Context) => any = (
  name,
  { stub }
) => ({
  getQueryResult: async (attributes: string[]) => {
    const iterator = await stub.getStateByPartialCompositeKey(name, attributes);
    const result = {};
    while (true) {
      const { value, done } = await iterator.next();
      if (value && value.value.toString()) {
        const json = JSON.parse((value.value as Buffer).toString('utf8'));
        result[json.key] = json;
      }
      if (done) {
        await iterator.close();
        return Buffer.from(JSON.stringify(result));
      }
    }
  },
  addState: async json =>
    await stub.putState(
      stub.createCompositeKey(name, splitKey(json.key)),
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
