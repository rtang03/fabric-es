import type { BaseEntity, Commit, QueryHandlerEntity, Paginated } from '@fabric-es/fabric-cqrs';
import { ApolloError } from 'apollo-server';
import { withFilter } from 'graphql-subscriptions';
import assign from 'lodash/assign';
import values from 'lodash/values';
import type { QueryHandlerGqlCtx } from '../types';
import { getLogger } from '../utils';
import { catchErrors } from '../utils/catchErrors';
import { rebuildIndex } from './rebuildIndex';
import { reconcile } from './reconcile';

const COMMIT_ARRIVED = 'COMMIT_ARRIVED';
const DEV = 'DEV';
const logger = getLogger('[gateway-lib] queryHandler/resolvers.js');
const parseEntity = (data: BaseEntity[]) =>
  data
    ? data.map((entity) => ({
        id: entity.id,
        entityName: entity._entityName,
        value: JSON.stringify(entity),
        desc: entity?.desc,
        tag: entity?.tag,
        commits: entity?._commit,
        events: entity?._event,
        creator: entity?._creator,
        created: entity?._created || 0,
        lastModified: entity?._ts || 0,
        timeline: entity?._timeline,
        reducer: entity?._reducer,
      }))
    : null;

export const resolvers = {
  Mutation: {
    ping: async (_, { message }, { pubSub }: QueryHandlerGqlCtx) => {
      await pubSub.publish(DEV, { pong: message });
      return true;
    },
    reloadEntities: catchErrors(
      async (
        _,
        { entityNames }: { entityNames: string[] },
        { publisher, queryHandler }: QueryHandlerGqlCtx
      ) => {
        await rebuildIndex(publisher, logger);

        await reconcile(entityNames, queryHandler, logger);
        return true;
      },
      { fcnName: 'reloadEntity', useAuth: false, useAdmin: false, logger }
    ),
    createCommit: catchErrors(
      async (
        _,
        {
          entityName,
          id,
          type,
          payloadString,
        }: { entityName: string; id: string; type: string; payloadString: string },
        { queryHandler }: QueryHandlerGqlCtx
      ) => {
        const payload = JSON.parse(payloadString);

        // TODO: add auth to here.

        const { data } = await queryHandler
          .create(entityName)({ enrollmentId: 'admin-org1.net', id })
          .save({ events: [{ type, payload }] });

        return values<Commit>(data)[0];
      },
      { fcnName: 'createCommit', useAuth: false, useAdmin: false, logger }
    ),
  },
  Query: {
    me: () => 'Hello',
    fullTextSearchCommit: catchErrors<Paginated<Commit> | ApolloError>(
      async (
        _,
        { query, cursor = 0, pagesize = 10 }: { query: string; cursor?: number; pagesize?: number },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Paginated<Commit> | ApolloError> => {
        const filtered = query.split(' ').filter((item) => !!item);
        const dataOption = ['SORTBY', 'ts', 'DESC'];

        const { data, error, status } = await queryHandler.fullTextSearchCommit(
          [...filtered, ...dataOption],
          cursor,
          pagesize
        );

        return status !== 'OK'
          ? new ApolloError(JSON.stringify(error))
          : {
              ...data,
              items: data.items.map((commit) =>
                assign(commit, { eventsString: JSON.stringify(commit.events) })
              ),
            };
      },
      { fcnName: 'fullTextSearchCommit', useAdmin: false, useAuth: false, logger }
    ),
    fullTextSearchEntity: catchErrors<Paginated<QueryHandlerEntity> | ApolloError>(
      async (
        _,
        { query, cursor = 0, pagesize = 10 }: { query: string; cursor?: number; pagesize?: number },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Paginated<QueryHandlerEntity> | ApolloError> => {
        const filtered = query.split(' ').filter((item) => !!item);
        const dataOption = ['SORTBY', 'ts', 'DESC'];

        const { data, error, status } = await queryHandler.fullTextSearchEntity(
          [...filtered, ...dataOption],
          cursor,
          pagesize
        );

        return status !== 'OK'
          ? new ApolloError(JSON.stringify(error))
          : { ...data, items: parseEntity(data.items) };
      },
      { fcnName: 'fullTextSearchEntity', useAdmin: false, useAuth: false, logger }
    ),
    paginatedEntity: catchErrors<Paginated<QueryHandlerEntity> | ApolloError>(
      async (
        _,
        criteria: {
          creator: string;
          cursor: number;
          pagesize: number;
          entityName: string;
          id: string;
          scope: 'CREATED' | 'LAST_MODIFIED';
          startTime: number;
          endTime: number;
          sortByField: 'id' | 'key' | 'ts' | 'created' | 'creator';
          sort: 'ASC' | 'DESC';
        },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Paginated<QueryHandlerEntity> | ApolloError> => {
        !criteria.cursor && (criteria.cursor = 0);
        !criteria.pagesize && (criteria.pagesize = 10);

        const { entityName, id } = criteria;
        const { data, error, status } = await queryHandler.getPaginatedEntityById(entityName)(
          criteria,
          id
        );

        return status !== 'OK'
          ? new ApolloError(JSON.stringify(error))
          : { ...data, items: parseEntity(data.items) };
      },
      { fcnName: 'paginatedMetaEntity', useAdmin: false, useAuth: false, logger }
    ),
    paginatedCommit: catchErrors<Paginated<Commit> | ApolloError>(
      async (
        _,
        criteria: {
          creator: string;
          cursor: number;
          pagesize: number;
          entityName: string;
          id: string;
          events: string[];
          startTime: number;
          endTime: number;
          sortByField: 'id' | 'key' | 'entityName' | 'ts' | 'creator';
          sort: 'ASC' | 'DESC';
        },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Paginated<Commit> | ApolloError> => {
        !criteria.cursor && (criteria.cursor = 0);
        !criteria.pagesize && (criteria.pagesize = 10);

        const { entityName, id } = criteria;
        const { data, error, status } = await queryHandler.getPaginatedCommitById(entityName)(
          criteria,
          id
        );

        return status !== 'OK' ? new ApolloError(JSON.stringify(error)) : data;
      },
      { fcnName: 'paginatedCommit', useAdmin: false, useAuth: false, logger }
    ),
  },
  Subscription: {
    pong: {
      subscribe: (_, __, { pubSub }: QueryHandlerGqlCtx) => {
        logger.info(`pubSub triggered: ${DEV} - ping`);

        return pubSub.asyncIterator([DEV]);
      },
    },
    entityAdded: {
      // note: transformation can be implemented, if needed
      // resolve: ({ events, key }) => ({ events, key, }),
      subscribe: withFilter(
        (_, { entityName }, { pubSub }: QueryHandlerGqlCtx) =>
          pubSub.asyncIterator(`${COMMIT_ARRIVED}`),
        ({ entityAdded }, variables) => entityAdded.commit.entityName === variables.entityName
      ),
    },
    systemEvent: {
      subscribe: (_, __, { pubSub }: QueryHandlerGqlCtx) => pubSub.asyncIterator('SYSTEM_EVENT'),
    },
  },
};
