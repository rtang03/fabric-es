import { keys } from 'lodash';
import { NAMESPACE as NS, Policy } from '../../types';
import { splitKey } from '../../utils';

const noResult = Promise.resolve([]);
const createKey = (keyparts: string[]) =>
  keyparts.reduce((pre, cur) => pre + cur, '');
const deleteRecord = (db: any, key: string) => {
  const length = keys(db).length;
  delete db[key];
  return length === keys(db).length ? null : key;
};
const deleteRecords = (db: any, keyparts: string[]) =>
  keys(db)
    .filter(key => key.startsWith(createKey(keyparts)))
    .map(key => {
      delete db[key];
      return key;
    });

const stateList = (
  namespace: string,
  { mspAttributeDb: mspDb, resourceAttributeDb: resDb, policyDb }
) => ({
  getQueryResult: async (keyparts: string[]) =>
    ({
      [NS.RESOURCE_ATTRIBUTE]: () => resDb[createKey(keyparts)] || noResult,
      [NS.POLICY]: () => policyDb[keyparts[0]] || noResult
    }[namespace]()),
  getState: async inputkey =>
    ({
      [NS.MSP_ATTRIBUTE]: key => mspDb[key] || noResult,
      [NS.POLICY]: key => policyDb[key] || noResult
    }[namespace](createKey(splitKey(inputkey)))),
  addState: async (inputkey: string, item: any) =>
    ({
      [NS.RESOURCE_ATTRIBUTE]: key => (resDb[key] = Promise.resolve(item)),
      [NS.MSP_ATTRIBUTE]: key => (mspDb[key] = Promise.resolve(item)),
      [NS.POLICY]: key => (policyDb[key] = Promise.resolve(item))
    }[namespace](createKey(splitKey(inputkey)))),
  deleteStateByKey: async inputkey =>
    ({
      [NS.MSP_ATTRIBUTE]: key => deleteRecord(mspDb, key),
      [NS.POLICY]: key => deleteRecord(policyDb, key)
      // [NS.RESOURCE_ATTRIBUTE]: key => deleteRecord(resDb, key),
    }[namespace](createKey(splitKey(inputkey)))),
  deleteStatesByKeyRange: async (keyparts: string[]) =>
    ({
      [NS.RESOURCE_ATTRIBUTE]: () => deleteRecords(resDb, keyparts),
      [NS.POLICY]: () => deleteRecords(policyDb, keyparts)
    }[namespace]())
});

export default stateList;
