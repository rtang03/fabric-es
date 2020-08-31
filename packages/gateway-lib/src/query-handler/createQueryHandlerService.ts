import util from 'util';
import {
  createQueryDatabase,
  createQueryHandler,
  getNetwork,
  getReducer,
  QueryHandler,
  Reducer,
} from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Gateway, Network, Wallet } from 'fabric-network';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis, { RedisOptions } from 'ioredis';
import fetch from 'node-fetch';
import { Organization, OrgEvents, orgReducer } from '../admin/model/organization';
import { QueryHandlerGqlCtx } from '../types';
import { getLogger } from '../utils';
import { isAuthResponse } from '../utils';
import { reconcile, rebuildIndex, resolvers, typeDefs } from './index';

export const createQueryHandlerService: (
  entityNames: string[],
  option: {
    redisOptions: RedisOptions;
    enrollmentId: string;
    channelName: string;
    connectionProfile: string;
    asLocalhost: boolean;
    wallet: Wallet;
    reducers: Record<string, Reducer>;
    authCheck: string;
    playground?: boolean;
    introspection?: boolean;
  }
) => Promise<{
  server: ApolloServer;
  shutdown: () => Promise<void>;
  queryHandler: QueryHandler;
  publisher: Redis.Redis;
}> = async (
  entityNames,
  {
    redisOptions,
    enrollmentId,
    connectionProfile,
    channelName,
    wallet,
    asLocalhost,
    reducers,
    authCheck,
    playground = true,
    introspection = true,
  }
) => {
  const logger = getLogger('[gateway-lib] createQueryHandlerService.js');
  const publisher = new Redis(redisOptions);
  const subscriber = new Redis(redisOptions);

  logger.info(util.format('redis option: %j', redisOptions));

  let gateway: Gateway;
  let network: Network;

  try {
    const networkConfig = await getNetwork({
      discovery: true,
      asLocalhost,
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
    });
    gateway = networkConfig.gateway;
    network = networkConfig.network;
  } catch (e) {
    logger.error(util.format('fail to obtain Fabric network config, %j', e));
    throw new Error(e);
  }

  // Add common domain model reducer(s)
  entityNames.push('organization');
  reducers['organization'] = getReducer<Organization, OrgEvents>(orgReducer);

  // Step 1: Rebuild Index
  await rebuildIndex(publisher, logger);

  const pubSub = new RedisPubSub({ publisher, subscriber });
  const queryDatabase = createQueryDatabase(publisher);
  const queryHandler = createQueryHandler({
    entityNames,
    channelName,
    connectionProfile,
    gateway,
    network,
    queryDatabase,
    reducers,
    wallet,
    pubSub,
  });

  try {
    // Step 2: Subscribe Hub.
    // Note: This may sometimes subscribe a pre-existing contract event (commit)
    // from a running Fabric Peer. This commit is invalid, and be remove by step 3 below
    await queryHandler.subscribeHub(entityNames);
  } catch (e) {
    logger.error(util.format('fail to subscribeHub, %j', e));
    throw new Error(e);
  }
  try {
    // Step 3: Clean up query-database, and Reconcile
    await reconcile(entityNames, queryHandler, logger);
  } catch (e) {
    logger.error(util.format('fail to reconcile, %j', e));
    throw new Error(e);
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    playground,
    introspection,
    subscriptions: {
      onConnect: (connectionParams, webSocket) => {
        console.log(connectionParams);
        // if (connectionParams.authToken) {
        //   return validateToken(connectionParams.authToken)
        //     .then(findUser(connectionParams.authToken))
        //     .then(user => {
        //       return {
        //         currentUser: user,
        //       };
        //     });
        // }
        // throw new Error('Missing auth token!');
      },
      onDisconnect: (webSocket, context) => {
        console.log(context.request);
      },
    },
    context: async ({ req: { headers } }) => {
      const token = headers?.authorization?.split(' ')[1] || null;

      const ctx: QueryHandlerGqlCtx = {
        pubSub,
        queryHandler,
        queryDatabase,
        publisher,
        entityNames,
      };

      try {
        const response = await fetch(authCheck, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          const result: unknown = await response.json();

          if (isAuthResponse(result)) return { ...result, ...ctx };
        }
        logger.warn(`authenticate fails, status: ${response.status}`);
      } catch (e) {
        logger.error(util.format('authenticationCheck error: %j', e));
      }
      return ctx;
    },
  });

  const shutdown = async () => {
    return new Promise<void>(async (resolve, reject) => {
      queryHandler.unsubscribeHub();

      await subscriber.unsubscribe()
        .catch(err => logger.error(util.format('Error unsubscribing from redis: %j', err)));
      await subscriber.quit()
        .catch(err => logger.error(util.format('Error disconnecting the subscriber from redis: %j', err)));
      await publisher.quit()
        .catch(err => logger.error(util.format('Error disconnecting the publisher from redis: %j', err)));

      return server
        .stop()
        .then(() => {
          logger.info(`Query handler service stopped :)`);
          resolve();
        })
        .catch((err) => {
          logger.error(util.format(`An error occurred while shutting down the query handler: %j`, err));
          reject();
        });
      });
  };

  return { server, shutdown, queryHandler, publisher };
};
