import filter from 'lodash/filter';
import omit from 'lodash/omit';
import values from 'lodash/values';
import { createCommit } from '../store/utils';
import { Commit, HandlerResponse, Repository } from '../types';

const getHistory = (commits: Commit[]): any[] => {
  const result = [];
  commits.forEach(({ events }) => events.forEach((item) => result.push(item)));
  return result;
};

const getEntities = ({ mockdb, entityName, reducer }) =>
  values(
    values(filter(values(mockdb), { entityName })).reduce(
      (commit: Commit, { entityId, events }: Commit) => {
        commit[entityId] = commit[entityId] || [];
        events.forEach((item) => commit[entityId].push(item));
        return commit;
      },
      {}
    )
  ).map((events) => reducer(events));

export const getMockRepository = <TEntity, TEvent>(
  mockdb: Record<string, Commit>,
  entityName: string,
  reducer: (history) => TEntity
): Pick<
  Repository<TEntity, TEvent>,
  'create' | 'getById' | 'getByEntityName' | 'getCommitById' | 'find' | 'getEntityName'
> => ({
  create: ({ id, enrollmentId }) => ({
    save: ({ events }) => {
      const entity: Commit = createCommit({
        id,
        entityName,
        version: 0,
        events,
      });
      mockdb[entity.commitId] = entity;

      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              status: 'OK',
              data: { [`${entity.entityName}::${entity.id}`]: omit(entity, ['events']) },
            }),
          50
        )
      );
    },
  }),
  getById: ({ id, enrollmentId }) =>
    new Promise<any>((resolve) => {
      const matched = filter(values<Commit>(mockdb), ({ entityId }) => entityId === id);
      const matchEvents = getHistory(matched);
      setTimeout(
        () =>
          resolve({
            currentState: reducer(matchEvents),
            save: ({ events }) => {
              const entity = createCommit({
                id,
                entityName,
                version: matched.length,
                events,
              });
              mockdb[entity.commitId] = entity;

              return Promise.resolve({
                status: 'OK',
                data: { [`${entity.entityName}::${entity.id}`]: omit(entity, ['events']) },
              });
            },
          }),
        50
      );
    }),
  getByEntityName: () =>
    new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            status: 'OK',
            data: getEntities({ entityName, reducer, mockdb }),
          }),
        50
      );
    }),
  getCommitById: ({ id }) =>
    new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            status: 'OK',
            data: filter(values<Commit>(mockdb), ({ entityId }) => entityId === id),
          }),
        50
      );
    }),
  find: ({ byId, byDesc }) =>
    new Promise<HandlerResponse<Record<string, TEntity>>>((resolve) => {
      setTimeout(() => {
        const entities: TEntity[] = getEntities({
          entityName,
          reducer,
          mockdb,
        });
        const entityArray: any[] = byDesc ? [] : byId ? filter(entities, { id: byId }) : [];
        const data = {};

        entityArray.forEach((entity) => (data[`${entityName}::${entity.id}`] = entity));

        resolve({ data, status: 'OK' });
      }, 50);
    }),
  getEntityName: () => entityName,
});
