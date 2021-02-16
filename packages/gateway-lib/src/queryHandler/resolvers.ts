import type { Commit, OutputCommit, Paginated, QueryHandler } from '@fabric-es/fabric-cqrs';
import { ApolloError, PubSub, UserInputError } from 'apollo-server';
import { withFilter } from 'graphql-subscriptions';
import GraphQLJSON from 'graphql-type-json';
import type { Notification } from '../types';
import { getLogger } from '../utils';
import { catchResolverErrors } from '../utils/catchResolverErrors';
import { reconcile } from './reconcile';

type FullTextSearchInput = {
  query: string;
  cursor: number;
  pagesize?: number;
  param?: string;
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
    // TODO: This api is NOT well-tested, and need further development
    //  see https://github.com/rtang03/fabric-es/issues/173
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
        const paramJSON = param && JSON.parse(param);

        const { data, error, status } = await queryHandler.fullTextSearchCommit({
          query,
          cursor,
          pagesize,
          param: paramJSON,
        });

        // OutputCommit - "data" returns
        // items: [
        //   {
        //     id: 'qh_gql_test_counter_001',
        //     entityName: 'counter',
        //     commitId: '20210215044613772',
        //     mspId: 'Org1MSP',
        //     creator: 'admin-org1.net',
        //     event: 'Increment',
        //     entityId: 'qh_gql_test_counter_001',
        //     version: 0,
        //     ts: 1613364371883,
        //     events: [Array]
        //   }
        // ],

        if (status !== 'OK') throw new ApolloError(JSON.stringify(error));

        return data;
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
        if (!entityName) throw new UserInputError('entityName is missing');

        const paramJSON = param && JSON.parse(param);

        const { data, error, status } = await queryHandler.fullTextSearchEntity({
          entityName,
          query,
          pagesize,
          cursor,
          param: paramJSON,
        });

        // e.g. OutputCounter - "data" returns
        // items: [
        //   {
        //     createdAt: '1613366214804',
        //     creator: 'admin-org1.net',
        //     description: 'my desc',
        //     eventInvolved: [Array],
        //     id: 'qh_gql_test_counter_001',
        //     tags: [Array],
        //     timestamp: '1613366214804',
        //     value: 1
        //   }
        // ],

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
              commitId: keypart[4],
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
