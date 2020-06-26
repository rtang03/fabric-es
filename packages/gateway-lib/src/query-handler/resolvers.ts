import { BaseEntity, Commit } from '@fabric-es/fabric-cqrs';
import { ApolloError } from 'apollo-server';
import { withFilter } from 'graphql-subscriptions';
import assign from 'lodash/assign';
import values from 'lodash/values';
import type { MetaEntity, Paginated, QueryHandlerGqlCtx } from '../types';
import { getLogger } from '../utils';
import { catchErrors } from '../utils/catchErrors';
import { rebuildIndex } from './rebuildIndex';
import { reconcile } from './reconcile';

const COMMIT_ARRIVED = 'COMMIT_ARRIVED';
const DEV = 'DEV';
const logger = getLogger('[gateway-lib] queryHandler/resolvers.js');
const metaEntityParser = (data: BaseEntity[]) =>
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
const getPaginated: <T>(items: T[], total, cursor: number) => Paginated<T> = (
  items,
  total,
  cursor
) => ({
  total,
  items,
  hasMore: items.length ? cursor + items.length < total : false,
  cursor: items.length ? cursor + items.length : null,
});
const totalOption = ['SORTBY', 'ts', 'DESC', 'LIMIT', 0, 0];

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
    fullTextSearchCommit: catchErrors(
      async (
        _,
        { query, cursor = 0, pagesize = 10 }: { query: string; cursor?: number; pagesize?: number },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Paginated<Commit> | ApolloError> => {
        const filtered = query.split(' ').filter((item) => !!item);
        const dataOption = ['SORTBY', 'ts', 'DESC', 'LIMIT', cursor, pagesize];

        const { data, error, status } = await queryHandler.fullTextSearchCommit()({
          query: [...filtered, ...dataOption],
        });

        const {
          data: total,
          status: totalStatus,
          error: totalError,
        } = await queryHandler.fullTextSearchCommit()({ query: [...filtered, ...totalOption] });

        return status !== 'OK'
          ? new ApolloError(JSON.stringify(error))
          : totalStatus !== 'OK'
          ? new ApolloError(JSON.stringify(totalError))
          : getPaginated<Commit>(
              (data as Commit[]).map((commit) =>
                assign(commit, { eventsString: JSON.stringify(commit.events) })
              ),
              total,
              cursor
            );
      },
      { fcnName: 'fullTextSearchCommit', useAdmin: false, useAuth: false, logger }
    ),
    fullTextSearchEntity: catchErrors<Paginated<MetaEntity> | ApolloError>(
      async (
        _,
        { query, cursor = 0, pagesize = 10 }: { query: string; cursor?: number; pagesize?: number },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Paginated<MetaEntity> | ApolloError> => {
        const filtered = query.split(' ').filter((item) => !!item);
        const dataOption = ['SORTBY', 'ts', 'DESC', 'LIMIT', cursor, pagesize];

        const { data, error, status } = await queryHandler.fullTextSearchEntity<BaseEntity>()({
          query: [...filtered, ...dataOption],
        });

        const {
          data: total,
          status: totalStatus,
          error: totalError,
        } = await queryHandler.fullTextSearchEntity<BaseEntity>()({
          query: [...filtered, ...totalOption],
        });

        return status !== 'OK'
          ? new ApolloError(JSON.stringify(error))
          : totalStatus !== 'OK'
          ? new ApolloError(JSON.stringify(totalError))
          : getPaginated<MetaEntity>(metaEntityParser(data as any[]), total, cursor);
      },
      { fcnName: 'fullTextSearchEntity', useAdmin: false, useAuth: false, logger }
    ),
    paginatedMetaEntity: catchErrors<Paginated<MetaEntity> | ApolloError>(
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

        const {
          data: total,
          status: totalStatus,
          error: totalError,
        } = await queryHandler.meta_getEntityByEntNameEntId(
          entityName,
          id
        )({ creator, scope, startTime, endTime, sort, sortByField, cursor: 0, pagesize: 0 });

        return status !== 'OK'
          ? new ApolloError(JSON.stringify(error))
          : totalStatus !== 'OK'
          ? new ApolloError(JSON.stringify(totalError))
          : getPaginated<MetaEntity>(metaEntityParser(data), total, cursor);
      },
      { fcnName: 'paginatedMetaEntity', useAdmin: false, useAuth: false, logger }
    ),
    paginatedCommit: catchErrors<Paginated<Commit> | ApolloError>(
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

        const {
          data: total,
          status: totalStatus,
          error: totalError,
        } = await queryHandler.meta_getCommitByEntNameEntId(
          entityName,
          id
        )({ creator, events, startTime, endTime, sort, sortByField, cursor: 0, pagesize: 0 });

        return status !== 'OK'
          ? new ApolloError(JSON.stringify(error))
          : totalStatus !== 'OK'
          ? new ApolloError(JSON.stringify(totalError))
          : getPaginated<Commit>(data, total, cursor);
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
