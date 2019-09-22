import { assign, filter, groupBy, isNumber, keys, values } from 'lodash';
import { Commit, ProjectionDb } from '../types';

const db: Record<string, any> = {};

const getHistory = (commits: Commit[]): any[] => {
  const history = [];
  commits.forEach(({ events }) => events.forEach(item => history.push(item)));
  return history;
};

export const projectionDb: ProjectionDb = {
  find: ({ all, contain, where }) =>
    new Promise(resolve => {
      if (all) {
        resolve({ data: values(db) });
      } else if (where) {
        resolve({ data: filter(values(db), where) });
      } else if (contain) {
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
      const { id } = values(commit)[0];
      db[id] = assign({ id }, reducer(getHistory(values(commit))));
      resolve({ data: { [id]: {} } });
    }),
  upsertMany: ({ commits, reducer }) =>
    new Promise(resolve => {
      const group = groupBy(commits, ({ id }) => id);
      const entities = [];
      keys(group).forEach(id =>
        entities.push(assign({ id }, reducer(getHistory(values(group[id])))))
      );
      const data = {};
      entities.forEach(entity => {
        db[entity.id] = entity;
        data[entity.id] = {};
      });
      resolve({ data });
    })
};
