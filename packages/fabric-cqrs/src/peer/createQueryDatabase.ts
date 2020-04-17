import { Utils } from 'fabric-common';
import { filter, remove, values } from 'lodash';
import { Commit, QueryDatabase } from '../types';

/**
 * **createQueryDatabase** create in-memory query database
 * @returns [[QueryDatabase]]
 */
export const createQueryDatabase: () => QueryDatabase = () => {
  const logger = Utils.getLogger('[fabric-cqrs] createQueryDatabase.js');

  let db: Record<string, Commit> = {};
  let newDB;

  return {
    deleteByEntityId: ({ entityName, id }) =>
      new Promise(resolve => {
        newDB = values(db);
        remove(newDB, { id, entityName });
        db = {};
        newDB.forEach(obj => (db[obj.commitId] = obj));

        logger.info('deleteByEntityId complete');
        resolve({ status: '1 number of record deleted successful' });
      }),
    deleteByEntityName: ({ entityName }) =>
      new Promise(resolve => {
        newDB = values(db);
        remove(newDB, { entityName });
        db = {};
        newDB.forEach(obj => (db[obj.commitId] = obj));

        logger.info('deleteByEntityName complete');
        resolve({ status: 'all records deleted successfully' });
      }),
    queryByEntityId: ({ entityName, id }) =>
      new Promise(resolve => {
        const data: Record<string, Commit> = {};
        // filter(db, obj => obj.id === id && obj.entityName === entityName).forEach(
        filter(db, { id, entityName }).forEach(obj => (data[obj.commitId] = obj));

        logger.info('queryByEntityId complete');
        resolve({ data });
      }),
    queryByEntityName: ({ entityName }) =>
      new Promise(resolve => {
        const data: Record<string, Commit> = {};
        filter(db, { entityName }).forEach(obj => (data[obj.commitId] = obj));

        logger.info('queryByEntityName complete');
        resolve({ data });
      }),
    merge: ({ commit }) =>
      new Promise(resolve => {
        db[commit.commitId] = commit;
        // console.log('after merge:', db);
        const data = {};
        data[commit.commitId] = commit;

        logger.info('merge complete');
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

        logger.info('mergeBatch complete');
        resolve({ data });
      })
  };
};
