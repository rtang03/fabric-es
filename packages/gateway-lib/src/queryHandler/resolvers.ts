import type { Commit, OutputCommit, Paginated, QueryHandler } from '@fabric-es/fabric-cqrs';
import { ApolloError, PubSub } from 'apollo-server';
import { withFilter } from 'graphql-subscriptions';
import GraphQLJSON from 'graphql-type-json';
import assign from 'lodash/assign';
import type { FTSearchParameters } from 'redis-modules-sdk';
import type { Notification } from '../types';
import { catchResolverErrors, getLogger } from '../utils';
import { reconcile } from './reconcile';

type FullTextSearchInput = {
  query: string;
  cursor: number;
  pagesize?: number;
  param?: FTSearchParameters;
};

type ApolloContext = { queryHandler: QueryHandler; username: string; pubSub: PubSub };

const COMMIT_ARRIVED = 'COMMIT_ARRIVED';
const DEV = 'DEV';
const logger = getLogger('[gateway-lib] queryHandler/resolvers.js');

/**
 * @about query handler resolvers
 */
export const resolvers = {
  JSON: GraphQLJSON,
  Mutation: {
    createCommit: catchResolverErrors<Commit>(
      async (
        _,
        { entityName, id, type, payloadString },
        { queryHandler, username }: ApolloContext
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
    ping: async (_, { message }: { message: string }, { pubSub }: ApolloContext) => {
      await pubSub.publish(DEV, { pong: message });
      return true;
    },
    reloadEntities: catchResolverErrors<boolean>(
      async (
        _,
        { entityNames }: { entityNames: string[] },
        { queryHandler }: ApolloContext
      ): Promise<boolean> => {
        await reconcile(entityNames, queryHandler, logger);
        return Promise.resolve(true);
      },
      { fcnName: 'reloadEntity', useAuth: true, useAdmin: true, logger }
    ),
  },
  Query: {
    me: () => 'Hello',
    fullTextSearchCommit: catchResolverErrors<Paginated<OutputCommit>>(
      async (
        _,
        { query, cursor = 0, pagesize = 10, param }: FullTextSearchInput,
        { queryHandler }: ApolloContext
      ): Promise<Paginated<OutputCommit>> => {
        const { data, error, status } = await queryHandler.fullTextSearchCommit({
          query,
          cursor,
          pagesize,
          param,
        });

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
    fullTextSearchEntity: catchResolverErrors<Paginated<any>>(
      async (
        _,
        {
          entityName,
          query,
          cursor = 0,
          pagesize = 10,
          param,
        }: { entityName: string } & FullTextSearchInput,
        { queryHandler }: ApolloContext
      ): Promise<Paginated<any>> => {
        const { data, error, status } = await queryHandler.fullTextSearchEntity({
          entityName,
          query,
          pagesize,
          cursor,
          param,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data;
      },
      { fcnName: 'fullTextSearchEntity', useAdmin: false, useAuth: true, logger }
    ),
    getNotifications: catchResolverErrors<Notification[]>(
      async (_, __, { queryHandler, username }: ApolloContext): Promise<Notification[]> => {
        const { data, error, status } = await queryHandler.getNotifications({ creator: username });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return Object.entries(data)
          .map(([key, value]) => {
            const keypart = key.split(':');
            return {
              creator: keypart[1],
              entityName: keypart[2],
              id: keypart[3],
              read: value === '0',
            } as Notification;
          })
          .reverse();
      },
      { fcnName: 'getNotifications', useAdmin: false, useAuth: true, logger }
    ),
    getNotification: catchResolverErrors<Notification[]>(
      async (
        _,
        { entityName, commitId, id }: { entityName: string; commitId: string; id: string },
        { queryHandler, username }: ApolloContext
      ) => {
        const { data, error, status } = await queryHandler.getNotification({
          creator: username,
          entityName,
          commitId,
          id,
        });

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return Object.entries(data)
          .map(([key, value]) => {
            const keypart = key.split(':');
            return {
              creator: keypart[1],
              entityName: keypart[2],
              id: keypart[3],
              commitId: keypart[4],
              read: value === '0',
            } as Notification;
          })
          .reverse();
      },
      { fcnName: 'getNotification', useAdmin: false, useAuth: true, logger }
    ),
  },
  Subscription: {
    pong: {
      subscribe: (_, __, { pubSub }: ApolloContext) => {
        logger.info(`pubSub triggered: ${DEV} - ping`);

        return pubSub.asyncIterator([DEV]);
      },
    },
    entityAdded: {
      // note: transformation can be implemented, if needed
      // resolve: ({ events, key }) => ({ events, key, }),
      subscribe: withFilter(
        (_, { entityName }: { entityName: string }, { pubSub }: ApolloContext) =>
          pubSub.asyncIterator(`${COMMIT_ARRIVED}`),
        ({ entityAdded }, variables) => entityAdded.commit.entityName === variables.entityName
      ),
    },
    systemEvent: {
      subscribe: (_, __, { pubSub }: ApolloContext) => pubSub.asyncIterator('SYSTEM_EVENT'),
    },
  },
};
