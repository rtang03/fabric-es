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
import { Organization, OrgEvents, orgReducer } from '../admin/model/organization';
import { QueryHandlerGqlCtx } from '../types';
import { getLogger } from '../utils';
import { reconcile, rebuildIndex, resolvers, typeDefs } from '.';

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
    playground?: boolean;
    introspection?: boolean;
  }
) => Promise<{ server: ApolloServer; queryHandler: QueryHandler; publisher: Redis.Redis }> = async (
  entityNames,
  {
    redisOptions,
    enrollmentId,
    connectionProfile,
    channelName,
    wallet,
    asLocalhost,
    reducers,
    playground = true,
    introspection = true,
  }
) => {
  const logger = getLogger('[gateway-lib] createQueryHandlerService.js');
  const publisher = new Redis(redisOptions);
  const subscriber = new Redis(redisOptions);

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
      // onConnect: (connectionParams, webSocket) => {
      //   if (connectionParams.authToken) {
      //     return validateToken(connectionParams.authToken)
      //       .then(findUser(connectionParams.authToken))
      //       .then(user => {
      //         return {
      //           currentUser: user,
      //         };
      //       });
      //   }
      //   throw new Error('Missing auth token!');
      // },
      // onDisconnect: (webSocket, context) => {
      // },
    },
    context: () => {
      return { pubSub, queryHandler, queryDatabase, publisher } as QueryHandlerGqlCtx;
    },
  });

  return { server, queryHandler, publisher };
};
