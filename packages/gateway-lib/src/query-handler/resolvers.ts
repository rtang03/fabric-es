import util from 'util';
import { Commit } from '@fabric-es/fabric-cqrs';
import { withFilter } from 'graphql-subscriptions';
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
        // const payload1 = { id, desc: 'query handler #1 sub-test', tag: 'subcription' };
        const payload = JSON.parse(payloadString);

        const { data } = await queryHandler
          .create(entityName)({ enrollmentId: 'admin-org1.net', id })
          .save({ events: [{ type, payload }] });

        return Object.values(data)[0];
      },
      {
        fcnName: 'createCommit',
        useAuth: false,
        useAdmin: false,
        logger,
      }
    ),
  },
  Query: {
    me: () => 'Hello',
    // queryByEntityName: async (
    //   _,
    //   { entityName, entityId },
    //   { pubsub }: { pubsub: RedisPubSub }
    // ): Promise<Commit[]> => {
    //   return [
    //     {
    //       id: '',
    //       entityName: '',
    //       commitId: '',
    //       version: 0,
    //       entityId: '',
    //       events: [],
    //     },
    //   ];
    // },
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
  },
};
