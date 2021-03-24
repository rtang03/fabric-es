import DidJWT from 'did-jwt';
import filter from 'lodash/filter';
import omit from 'lodash/omit';
import values from 'lodash/values';
import { createCommit } from '../store/utils';
import type { Commit, Repository } from '../types';
import { isBaseEventArray } from '../utils';

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

/**
 * @about create mock repository for public / onchain data
 * @params mockdb
 * @params entityName
 * @params reducer
 */
export const getMockRepository = <TEntity, TEvent>(
  mockdb: Record<string, Commit>,
  entityName: string,
  reducer: (history) => TEntity
): Pick<
  Repository<TEntity, TEvent>,
  | 'create'
  | 'getById'
  | 'getByEntityName'
  | 'getCommitById'
  | 'getEntityName'
  | 'fullTextSearchEntity'
> => ({
  create: ({ id, enrollmentId }) => ({
    save: ({ events, signedRequest }) => {
      let commit: Commit;
      if (signedRequest && signedRequest !== '') {
        // ignore input argument "events"
        const decoded = DidJWT.decodeJWT(signedRequest);
        const decodedEvents = decoded?.payload?.events;
        if (decodedEvents && isBaseEventArray(decodedEvents)) {
          commit = createCommit({
            id,
            entityName,
            version: 0,
            events: decodedEvents,
            signedRequest,
          });
        } else return Promise.reject(new Error('fail to parse events'));
      } else {
        commit = createCommit({
          id,
          entityName,
          version: 0,
          events,
          signedRequest: '',
        });
      }
      mockdb[commit.commitId] = commit;

      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              status: 'OK',
              data: omit(commit, 'events', 'signedRequest'),
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
            save: ({ events, signedRequest }) => {
              let commit: Commit;
              if (signedRequest && signedRequest !== '') {
                const decoded = DidJWT.decodeJWT(signedRequest);
                const decodedEvents = decoded?.payload?.events;
                if (decodedEvents && isBaseEventArray(decodedEvents)) {
                  commit = createCommit({
                    id,
                    entityName,
                    version: matched.length,
                    events: decodedEvents,
                    signedRequest,
                  });
                } else return Promise.reject(new Error('fail to parse events'));
              } else {
                commit = createCommit({
                  id,
                  entityName,
                  version: matched.length,
                  events,
                  signedRequest: '',
                });
              }
              mockdb[commit.commitId] = commit;

              return Promise.resolve({
                status: 'OK',
                data: omit(commit, 'events', 'signedRequest'),
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
  getEntityName: () => entityName,
  // WARN: it partially mocks fulltextsearch, "query" need EXACT match; no wildcard. Cursor is NOT correct.
  fullTextSearchEntity: ({ entityName, query, cursor, pagesize }) =>
    new Promise((resolve) => {
      setTimeout(() => {
        const items = getEntities({ entityName, reducer, mockdb }).filter((entity) =>
          entity.toString().contains(query)
        );
        resolve({
          status: 'OK',
          data: {
            total: items.length,
            cursor: 10,
            hasMore: false,
            items,
          },
        });
      }, 50);
    }),
});
