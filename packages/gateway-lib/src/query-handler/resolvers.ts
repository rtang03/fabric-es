import type { BaseEntity, Commit, QueryHandlerEntity, Paginated } from '@fabric-es/fabric-cqrs';
import { ApolloError } from 'apollo-server';
import { withFilter } from 'graphql-subscriptions';
import assign from 'lodash/assign';
import keys from 'lodash/keys';
import sortBy from 'lodash/sortBy';
import values from 'lodash/values';
import { Resolvers, EntityInfo } from '../generated';
import type { QueryHandlerGqlCtx, Notification } from '../types';
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
      }))
    : [];
const parseNotifications: (data: Record<string, string>[]) => Notification[] = (data) =>
  sortBy(
    data
      .map((item) => ({ key: keys(item)[0], value: values(item)[0] }))
      .map(({ key, value }) => {
        const keypart = key.split('::');
        return {
          creator: keypart[1],
          entityName: keypart[2],
          id: keypart[3],
          commitId: keypart[4],
          read: value === '0',
        } as Notification;
      }),
    'commitId'
  ).reverse();

export const resolvers: Resolvers = {
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
      { fcnName: 'reloadEntity', useAuth: true, useAdmin: true, logger }
    ),
    createCommit: catchErrors<Commit>(
      async (
        _,
        {
          entityName,
          id,
          type,
          payloadString,
        }: { entityName: string; id: string; type: string; payloadString: string },
        { queryHandler, username }: QueryHandlerGqlCtx
      ) => {
        const payload = JSON.parse(payloadString);

        const { data, error } = await queryHandler
          .create(entityName)({ enrollmentId: username, id })
          .save({ events: [{ type, payload }] });

        if (error) throw error;

        return data;
      },
      { fcnName: 'createCommit', useAuth: true, useAdmin: false, logger }
    ),
  },
  Query: {
    me: () => 'Hello',
    getEntityInfo: catchErrors<EntityInfo[]>(
      async (_, __, { entityNames, queryHandler }: QueryHandlerGqlCtx) => {
        const result = [];
        for await (const entityName of entityNames) {
          const { data, error } = await queryHandler.queryGetEntityInfo({ entityName });
          !error && result.push({ entityName, ...data });
        }

        return result;
      },
      { fcnName: 'getEntityInfo', useAdmin: false, useAuth: true, logger }
    ),
    fullTextSearchCommit: catchErrors<Paginated<Commit>>(
      async (
        _,
        { query, cursor = 0, pagesize = 10 }: { query: string; cursor?: number; pagesize?: number },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Paginated<Commit>> => {
        // const filtered = query.split(' ').filter((item) => !!item); // TODO - CHECK: why split the input with <space> ???????????????
        const filtered = [query];
        const dataOption = ['SORTBY', 'ts', 'DESC'];

        const { data, error, status } = await queryHandler.fullTextSearchCommit(
          [...filtered, ...dataOption],
          cursor,
          pagesize
        );

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return {
          ...data,
          items:
            data.items?.map((commit) =>
              assign(commit, { eventsString: JSON.stringify(commit.events) })
            ) || [],
        };
      },
      { fcnName: 'fullTextSearchCommit', useAdmin: false, useAuth: true, logger }
    ),
    fullTextSearchEntity: catchErrors<Paginated<QueryHandlerEntity>>(
      async (
        _,
        { query, cursor = 0, pagesize = 10 }: { query: string; cursor?: number; pagesize?: number },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Paginated<QueryHandlerEntity>> => {
        // const filtered = query.split(' ').filter((item) => !!item); // TODO - CHECK: why split the input with <space> ???????????????
        const filtered = [query];
        const dataOption = ['SORTBY', 'ts', 'DESC'];

        const { data, error, status } = await queryHandler.fullTextSearchEntity(
          [...filtered, ...dataOption],
          cursor,
          pagesize
        );

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return { ...data, items: parseEntity(data.items) };
      },
      { fcnName: 'fullTextSearchEntity', useAdmin: false, useAuth: true, logger }
    ),
    paginatedEntity: catchErrors<Paginated<QueryHandlerEntity>>(
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
      ): Promise<Paginated<QueryHandlerEntity>> => {
        !criteria.cursor && (criteria.cursor = 0);
        !criteria.pagesize && (criteria.pagesize = 10);

        const { entityName, id } = criteria;
        const { data, error, status } = await queryHandler.getPaginatedEntityById(entityName)(
          criteria,
          id
        );

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return { ...data, items: parseEntity(data.items) };
      },
      { fcnName: 'paginatedMetaEntity', useAdmin: false, useAuth: true, logger }
    ),
    paginatedCommit: catchErrors<Paginated<Commit>>(
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
      ): Promise<Paginated<Commit>> => {
        !criteria.cursor && (criteria.cursor = 0);
        !criteria.pagesize && (criteria.pagesize = 10);

        const { entityName, id } = criteria;
        const { data, error, status } = await queryHandler.getPaginatedCommitById(entityName)(
          criteria,
          id
        );

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data;
      },
      { fcnName: 'paginatedCommit', useAdmin: false, useAuth: true, logger }
    ),
    getNotifications: catchErrors<Notification[]>(
      async (_, __, { queryHandler, username }: QueryHandlerGqlCtx): Promise<Notification[]> => {
        const { data, error, status } = await queryHandler.queryNotify({ creator: username });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return parseNotifications(data);
      },
      { fcnName: 'getNotifications', useAdmin: false, useAuth: true, logger }
    ),
    getNotification: catchErrors<Notification>(
      async (_, { entityName, commitId, id }, { queryHandler, username }: QueryHandlerGqlCtx) => {
        const { data, error, status } = await queryHandler.queryNotify({
          creator: username,
          entityName,
          commitId,
          id,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return parseNotifications(data)[0];
      },
      { fcnName: 'getNotification', useAdmin: false, useAuth: true, logger }
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
