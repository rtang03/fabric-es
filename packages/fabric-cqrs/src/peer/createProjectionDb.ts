import Client from 'fabric-client';
import { assign, filter, groupBy, isNumber, keys, values } from 'lodash';
import { Commit, ProjectionDb } from '../types';

const getHistory = (commits: Commit[]): any[] => {
  const history = [];
  commits.forEach(({ events }) => events.forEach(item => history.push(item)));
  return history;
};

export const createProjectionDb: (
  defaultEntityName: string
) => ProjectionDb = defaultEntityName => {
  const logger = Client.getLogger('createProjectionDb.js');

  const db: Record<string, any> = {};
  return {
    find: ({ all, contain, where }) =>
      new Promise(resolve => {
        if (all) {
          logger.info('return all');

          resolve({ data: values(db) });
        } else if (where) {
          logger.info('where clause');

          resolve({ data: filter(values(db), where) });
        } else if (contain) {
          logger.info('contain clause');

          resolve({
            data: filter(values(db), item =>
              JSON.stringify(item).includes(
                isNumber(contain) ? contain.toString() : contain
              )
            )
          });
        } else resolve({ data: null });
      }),
    upsert: ({ commit, reducer }) =>
      new Promise(resolve => {
        const { id, entityName } = values(commit)[0];
        if (defaultEntityName === entityName) {
          db[id] = assign({ id }, reducer(getHistory(values(commit))));
        }

        logger.info('upsert complete');
        resolve({ data: { [id]: {} } });
      }),
    upsertMany: ({ commits, reducer }) =>
      new Promise(resolve => {
        const filterCommits = filter(
          commits,
          ({ entityName }) => entityName === defaultEntityName
        );
        const group = groupBy(filterCommits, ({ id }) => id);
        const entities = [];
        keys(group).forEach(id =>
          entities.push(assign({ id }, reducer(getHistory(values(group[id])))))
        );
        const data = {};
        entities.forEach(entity => {
          db[entity.id] = entity;
          data[entity.id] = {};
        });

        logger.info('upsertMany complete');
        resolve({ data });
      })
  };
};
