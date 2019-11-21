import { filter, remove, values } from 'lodash';
import { Commit, QueryDatabase } from '../types';

let db: Record<string, Commit> = {
  '20181208155814606': {
    commitId: '20181208155814606',
    committedAt: '1544284694606',
    entityName: 'dev_test',
    entityId: 'ent_test_1001',
    id: 'ent_test_1001',
    version: 0,
    events: [
      {
        type: 'UserCreated',
        payload: {
          userId: 'ent_test_1001',
          name: 'Mr X',
          timestamp: 1544284694606
        }
      }
    ]
  }
};
let newDB;

export const queryDatabase: QueryDatabase = {
  deleteByEntityId: ({ entityName, id }) =>
    new Promise(resolve => {
      newDB = values(db);
      remove(newDB, { id, entityName });
      db = {};
      newDB.forEach(obj => (db[obj.commitId] = obj));
      resolve({ status: '1 number of record deleted successful' });
    }),
  deleteByEntityName: ({ entityName }) =>
    new Promise(resolve => {
      newDB = values(db);
      remove(newDB, { entityName });
      db = {};
      newDB.forEach(obj => (db[obj.commitId] = obj));
      resolve({ status: 'all records deleted successfully' });
    }),
  queryByEntityId: ({ entityName, id }) =>
    new Promise(resolve => {
      const data: Record<string, Commit> = {};
      console.log('logging "db"... ', db);
      // filter(db, obj => obj.id === id && obj.entityName === entityName).forEach(
      filter(db, { id, entityName }).forEach(obj => (data[obj.commitId] = obj));
      resolve({ data });
    }),
  queryByEntityName: ({ entityName }) =>
    new Promise(resolve => {
      const data: Record<string, Commit> = {};
      filter(db, { entityName }).forEach(obj => (data[obj.commitId] = obj));
      resolve({ data });
    }),
  merge: ({ commit }) =>
    new Promise(resolve => {
      db[commit.commitId] = commit;
      const data = {};
      data[commit.commitId] = commit;
      resolve({ data });
    }),
  mergeBatch: ({ entityName, commits }) =>
    new Promise(resolve => {
      const data = {};
      newDB = values(db);
      remove(newDB, { entityName });
      db = {};
      newDB.forEach(obj => (db[obj.commitId] = obj));
      values(commits).forEach(commit => {
        db[commit.commitId] = commit;
        data[commit.commitId] = {};
      });
      resolve({ data });
    })
};
