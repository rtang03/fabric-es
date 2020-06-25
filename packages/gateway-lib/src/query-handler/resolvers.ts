import { BaseEntity, Commit } from '@fabric-es/fabric-cqrs';
import { ApolloError } from 'apollo-server';
import { withFilter } from 'graphql-subscriptions';
import assign from 'lodash/assign';
import values from 'lodash/values';
import type { MetaEntity, Paginated, QueryHandlerGqlCtx } from '../types';
import { getLogger } from '../utils';
import { catchApolloErrors } from '../utils/catchApolloErrors';
import { rebuildIndex } from './rebuildIndex';
import { reconcile } from './reconcile';

const COMMIT_ARRIVED = 'COMMIT_ARRIVED';
const DEV = 'DEV';
const logger = getLogger('[gateway-lib] queryHandler/resolvers.js');
const metaEntityParser = (data: BaseEntity[]) =>
  data
    ? data.map((entity) => ({
        id: entity?.id || '',
        entityName: entity?._entityName,
        value: JSON.stringify(entity),
        desc: entity?.desc || '',
        tag: entity?.tag || '',
        commits: entity?._commit,
        events: entity?._event,
        creator: entity?._creator || '',
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
    reloadEntities: catchApolloErrors(
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
    createCommit: catchApolloErrors(
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

        const { data } = await queryHandler
          .create(entityName)({ enrollmentId: 'admin-org1.net', id })
          .save({ events: [{ type, payload }] });

        return values(data)[0];
      },
      { fcnName: 'createCommit', useAuth: false, useAdmin: false, logger }
    ),
  },
  Query: {
    me: () => 'Hello',
    fullTextSearchCommit: catchApolloErrors(
      async (
        _,
        { query }: { query: string },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Commit[] | ApolloError> => {
        const { data, error, status } = await queryHandler.fullTextSearchCommit()({
          query: query.split(' ').filter((item) => !!item),
        });

        if (status !== 'OK') return new ApolloError(JSON.stringify(error));

        return data
          ? values<Commit>(data).map((commit) =>
              assign({}, commit, { eventsString: JSON.stringify(commit.events) })
            )
          : null;
      },
      { fcnName: 'fullTextSearchCommit', useAdmin: false, useAuth: false, logger }
    ),
    fullTextSearchEntity: catchApolloErrors<MetaEntity[] | ApolloError>(
      async (
        _,
        { query }: { query: string },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<MetaEntity[] | ApolloError> => {
        const { data, error, status } = await queryHandler.fullTextSearchEntity<BaseEntity>()({
          query: query.split(' ').filter((item) => !!item),
        });

        return status === 'OK' ? metaEntityParser(data) : new ApolloError(JSON.stringify(error));
      },
      { fcnName: 'fullTextSearchEntity', useAdmin: false, useAuth: false, logger }
    ),
    paginatedMetaEntity: catchApolloErrors<Paginated<MetaEntity> | ApolloError>(
      async (
        _,
        {
          creator,
          cursor = 0,
          pagesize = 10,
          entityName,
          id,
          scope,
          startTime,
          endTime,
          sortByField,
          sort,
        }: {
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
      ) => {
        const { data, error, status } = await queryHandler.meta_getEntityByEntNameEntId(
          entityName,
          id
        )({ creator, cursor, pagesize, scope, startTime, endTime, sort, sortByField });

        if (status !== 'OK') return new ApolloError(JSON.stringify(error));

        const {
          data: total,
          status: totalStatus,
          error: totalError,
        } = await queryHandler.meta_getEntityByEntNameEntId(
          entityName,
          id
        )({ creator, scope, startTime, endTime, sort, sortByField, cursor: 0, pagesize: 0 });

        if (totalStatus !== 'OK') return new ApolloError(JSON.stringify(totalError));

        const items = metaEntityParser(data);

        return {
          total,
          items,
          hasMore: items.length ? cursor + items.length < total : false,
          cursor: items.length ? cursor + items.length : null,
        } as Paginated<MetaEntity>;
      },
      { fcnName: 'paginatedMetaEntity', useAdmin: false, useAuth: false, logger }
    ),
    paginatedCommit: catchApolloErrors<Paginated<Commit> | ApolloError>(
      async (
        _,
        {
          creator,
          cursor = 0,
          pagesize = 10,
          entityName,
          id,
          events,
          startTime,
          endTime,
          sortByField,
          sort,
        }: {
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
      ) => {
        const { data, error, status } = await queryHandler.meta_getCommitByEntNameEntId(
          entityName,
          id
        )({ creator, cursor, pagesize, events, startTime, endTime, sort, sortByField });

        if (status !== 'OK') return new ApolloError(JSON.stringify(error));

        const {
          data: total,
          status: totalStatus,
          error: totalError,
        } = await queryHandler.meta_getCommitByEntNameEntId(
          entityName,
          id
        )({ creator, events, startTime, endTime, sort, sortByField, cursor: 0, pagesize: 0 });

        if (totalStatus !== 'OK') return new ApolloError(JSON.stringify(totalError));

        return {
          total,
          hasMore: data.length ? cursor + data.length < total : false,
          cursor: data.length ? cursor + data.length : null,
          items: data,
        } as Paginated<Commit>;
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
