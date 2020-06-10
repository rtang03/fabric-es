import filter from 'lodash/filter';
import omit from 'lodash/omit';
import values from 'lodash/values';
import { createCommit } from '../store/utils';
import { Commit, PrivateRepository } from '../types';

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

export const getPrivateMockRepository = <TEntity, TEvent>(
  mockdb: Record<string, Commit>,
  entityName: string,
  reducer: (history) => TEntity
): Pick<
  PrivateRepository<TEntity, TEvent>,
  'create' | 'getById' | 'getCommitByEntityName' | 'getEntityName'
> => ({
  create: ({ enrollmentId, id }) => ({
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
  getById: ({ enrollmentId, id }) =>
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
  getCommitByEntityName: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        const data = {};
        filter(values<Commit>(mockdb), (commit) => commit.entityName === entityName).forEach(
          (commit) => (data[`${entityName}::${commit.id}::${commit.commitId}`] = commit)
        );
        resolve({ status: 'OK', data });
      }, 50);
    }),
  getEntityName: () => entityName,
});
