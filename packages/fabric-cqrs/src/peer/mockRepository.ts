import { filter, omit, values } from 'lodash';
import { createCommit } from '../cqrs/utils';
import { Commit, Repository } from '../types';

const getHistory = (commits: Commit[]): any[] => {
  const result = [];
  commits.forEach(({ events }) => events.forEach(item => result.push(item)));
  return result;
};

const getEntities = ({ mockdb, entityName, reducer }) =>
  values(
    values(filter(values(mockdb), { entityName })).reduce(
      (commit: Commit, { entityId, events }: Commit) => {
        commit[entityId] = commit[entityId] || [];
        events.forEach(item => commit[entityId].push(item));
        return commit;
      },
      {}
    )
  ).map(events => reducer(events));

export const getMockRepository = <TEntity, TEvent>(
  mockdb: Record<string, Commit>,
  entityName: string,
  reducer: (history) => TEntity
): Repository<TEntity, TEvent> => ({
  create: ({ id }) => ({
    save: events => {
      const entity: Commit = createCommit({
        id,
        entityName,
        version: 0,
        events
      });
      mockdb[entity.commitId] = entity;
      return new Promise(resolve =>
        setTimeout(() => resolve(omit(entity, ['events'])), 50)
      );
    }
  }),
  getById: ({ id }) =>
    new Promise<any>(resolve => {
      const matched = filter(
        values<Commit>(mockdb),
        ({ entityId }) => entityId === id
      );
      const matchEvents = getHistory(matched);
      setTimeout(
        () =>
          resolve({
            currentState: reducer(matchEvents),
            save: events => {
              const entity = createCommit({
                id,
                entityName,
                version: matched.length,
                events
              });
              mockdb[entity.commitId] = entity;
              return Promise.resolve(omit(entity, 'events'));
            }
          }),
        50
      );
    }),
  getByEntityName: () =>
    new Promise(resolve => {
      setTimeout(
        () =>
          resolve({
            data: getEntities({ entityName, reducer, mockdb })
          }),
        50
      );
    }),
  getCommitById: id =>
    new Promise(resolve => {
      setTimeout(
        () =>
          resolve({
            data: filter(
              values<Commit>(mockdb),
              ({ entityId }) => entityId === id
            )
          }),
        50
      );
    }),
  getProjection: ({
    where,
    all, // not implemented
    contain // not implemented
  }: {
    where?: any;
    all?: boolean;
    contain?: string;
  }) => {
    const entities: TEntity[] = getEntities({
      entityName,
      reducer,
      mockdb
    });
    return new Promise(resolve => {
      setTimeout(
        () =>
          resolve({
            data: where ? filter(entities, where) : []
          }),
        50
      );
    });
  }
});
