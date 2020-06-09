import { Commit } from '@fabric-es/fabric-cqrs';
import { ApolloError } from 'apollo-server';
import { withFilter } from 'graphql-subscriptions';
import assign from 'lodash/assign';
import values from 'lodash/values';
import { QueryHandlerGqlCtx } from '../types';
import { catchErrors, getLogger } from '../utils';
import { rebuildIndex } from './rebuildIndex';
import { reconcile } from './reconcile';

const COMMIT_ARRIVED = 'COMMIT_ARRIVED';
const DEV = 'DEV';
const logger = getLogger('[gateway-lib] queryHandler/resolvers.js');

export const resolvers = {
  Mutation: {
    ping: async (_, { message }, { pubSub }: QueryHandlerGqlCtx) => {
      await pubSub.publish(DEV, { pong: message });
      return true;
    },
    reloadEntities: catchErrors(
      async (_, { entityNames }, { publisher, queryHandler }: QueryHandlerGqlCtx) => {
        await rebuildIndex(publisher, logger);

        await reconcile(entityNames, queryHandler, logger);
        return true;
      },
      { fcnName: 'reloadEntity', useAuth: false, useAdmin: true, logger }
    ),
    createCommit: catchErrors(
      async (_, { entityName, id, type, payloadString }, { queryHandler }: QueryHandlerGqlCtx) => {
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
    fullTextSearchCommit: catchErrors(
      async (
        _,
        { query },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<Commit[] | ApolloError> => {
        const { data, error, status } = await queryHandler.fullTextSearchCommit()({ query });
        if (status !== 'OK') return new ApolloError(JSON.stringify(error));

        return data
          ? values<Commit>(data).map((commit) =>
              assign({}, commit, { eventsString: JSON.stringify(commit.events) })
            )
          : null;
      },
      { fcnName: 'fullTextSearchCommit', useAdmin: false, useAuth: false, logger }
    ),
    fullTextSearchEntity: catchErrors(
      async (
        _,
        { query },
        { queryHandler }: QueryHandlerGqlCtx
      ): Promise<{ entityName: string; id: string; value: string }[] | ApolloError> => {
        const { data, error, status } = await queryHandler.fullTextSearchEntity()({ query });

        if (status !== 'OK') return new ApolloError(JSON.stringify(error));

        return data
          ? Object.entries(data).map(([key, value]) => ({
              value: JSON.stringify(value),
              entityName: key.split('::')[0],
              id: key.split('::')[1],
            }))
          : null;
      },
      { fcnName: 'fullTextSearchEntity', useAdmin: false, useAuth: false, logger }
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