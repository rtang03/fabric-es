import util from 'util';
import {
  Commit,
  createQueryDatabase,
  createQueryHandler,
  getNetwork,
  getReducer,
  QueryDatabase,
  QueryHandler,
  RedisearchDefinition,
  RedisRepository,
  Reducer,
} from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Gateway, Network, Wallet } from 'fabric-network';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import type { RedisOptions } from 'ioredis';
import fetch from 'node-fetch';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';
import { Organization, OrgEvents, orgReducer } from '../admin';
import type { QueryHandlerGqlCtx } from '../types';
import { composeRedisRepos, getLogger, isAuthResponse } from '../utils';
import {
  reconcile,
  rebuildIndex,
  resolvers,
  typeDefs,
  QueryHandlerService,
  AddQHRedisRepository,
} from '.';

/**
 * @about create query handler microservice
 * @params entityNames
 * @params option
 * ```typescript
 * {
 *   // true if running with docker-compose
 *   asLocalhost: boolean;
 *   // url to auth-server
 *   authCheck: string;
 *   channelName: string;
 *   // path to connection profile yaml
 *   connectionProfile: string;
 *   enrollmentId: string;
 *   // allow graphql introspection
 *   introspection: boolean;
 *   // allow graphql playground
 *   playground: boolean;
 *   // reducer map
 *   reducers: Record<string, Reducer>
 *   // FileWallet instance
 *   wallet: Wallet
 * }
 * ```
 */
export const createQueryHandlerService: (option: {
  asLocalhost: boolean;
  authCheck: string;
  channelName: string;
  connectionProfile: string;
  enrollmentId: string;
  introspection?: boolean;
  playground?: boolean;
  redisOptions: RedisOptions;
  reducers: Record<string, Reducer>;
  wallet: Wallet;
}) => {
  addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
    entityName: string;
    fields: RedisearchDefinition<TInput>;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
  }) => AddQHRedisRepository;
} = ({
  asLocalhost,
  authCheck,
  connectionProfile,
  channelName,
  enrollmentId,
  introspection = true,
  playground = true,
  redisOptions,
  reducers,
  wallet,
}) => {
  const logger = getLogger('[gateway-lib] createQueryHandlerService.js');
  const entityNames = Object.keys(reducers);

  // prepare Redis pub / sub
  const publisher = new Redisearch(redisOptions);
  const subscriber = new Redisearch(redisOptions);
  const pubSub = new RedisPubSub({ publisher: publisher.redis, subscriber: subscriber.redis });

  // TODO: @paul, please revisit here. add common domain model reducer(s)
  entityNames.push('organization');
  reducers['organization'] = getReducer<Organization, OrgEvents>(orgReducer);

  logger.debug(util.format('redis option: %j', redisOptions));

  let redisRepos: Record<string, RedisRepository> = {};
  let queryHandler: QueryHandler = null;
  let queryDatabase: QueryDatabase;
  let readyToRunServer = false;

  const addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
    entityName: string;
    fields: RedisearchDefinition<TInput>;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
  }) => AddQHRedisRepository = ({ entityName, fields, preSelector, postSelector }) => {
    redisRepos = composeRedisRepos(
      publisher,
      redisRepos
    )({ entityName, fields, preSelector, postSelector });

    return { addRedisRepository, run };
  };

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

      const context: QueryHandlerGqlCtx = {
        pubSub,
        queryHandler,
        queryDatabase,
        publisher: publisher.redis,
        entityNames,
      };

      if (token) {
        try {
          const response = await fetch(authCheck, {
            method: 'POST',
            headers: { authorization: `Bearer ${token}` },
          });

          if (response.status === 200) {
            const result: unknown = await response.json();

            if (isAuthResponse(result)) return { ...result, ...context };
          }
          logger.warn(`authenticate fails, status: ${response.status}`);
        } catch (e) {
          logger.error(util.format('authenticationCheck error: %j', e));
        }
      }
      return context;
    },
  });

  const shutdown = async () =>
    new Promise<void>(async (resolve, reject) => {
      queryHandler.unsubscribeHub();
      queryHandler.disconnect();

      await subscriber.redis
        .unsubscribe()
        .catch((err) => logger.error(util.format('Error unsubscribing from redis: %j', err)));

      await subscriber.redis
        .quit()
        .catch((err) =>
          logger.error(util.format('Error disconnecting the subscriber from redis: %j', err))
        );

      await publisher.redis
        .quit()
        .catch((err) =>
          logger.error(util.format('Error disconnecting the publisher from redis: %j', err))
        );

      return server
        .stop()
        .then(() => {
          logger.info(`Query handler service stopped`);
          resolve();
        })
        .catch((err) => {
          logger.error(
            util.format(`An error occurred while shutting down the query handler: %j`, err)
          );
          reject();
        });
    });

  const run: () => Promise<QueryHandlerService> = async () => {
    // connect Redis
    try {
      await publisher.connect();
      logger.info('publisher connected');

      await subscriber.connect();
      logger.info('subscriber connected');
    } catch (e) {
      logger.error(util.format('fail to connect Redis, %j', e));
      throw new Error(e);
    }

    // prepare Fabric network connection
    let gateway: Gateway;
    let network: Network;
    try {
      const networkConfig = await getNetwork({
        asLocalhost,
        channelName,
        connectionProfile,
        discovery: true,
        enrollmentId,
        wallet,
      });

      logger.info('fabric connected');

      gateway = networkConfig.gateway;
      network = networkConfig.network;
    } catch (e) {
      logger.error(util.format('fail to obtain Fabric network config, %j', e));
      throw new Error(e);
    }

    // prepare queryHandler
    queryDatabase = createQueryDatabase(publisher, redisRepos);

    logger.info('queryDatabase ready');

    queryHandler = createQueryHandler({
      channelName,
      connectionProfile,
      entityNames,
      gateway,
      network,
      pubSub,
      queryDatabase,
      reducers,
      wallet,
    });

    logger.info('queryHandler ready');

    // rebuild Index
    const commitRepo = queryDatabase.getRedisCommitRepo();
    const indexes = [commitRepo, ...Object.values(redisRepos)];
    try {
      for await (const repo of indexes) {
        await rebuildIndex(repo, logger);
      }
      logger.info(`indexes created`);
    } catch (e) {
      logger.error(util.format('fail to rebuild index, %j', e));
      throw new Error(e);
    }

    // subscribe Fabric channel hub
    try {
      // Note: This may sometimes subscribe a pre-existing contract event (commit)
      // from a running Fabric Peer. This commit is invalid, and be remove by step 3 below
      await queryHandler.subscribeHub(entityNames);
      logger.info('subscribe eventhub');
    } catch (e) {
      logger.error(util.format('fail to subscribeHub, %j', e));
      throw new Error(e);
    }

    // clean up query-database, and reconcile
    try {
      await reconcile(entityNames, queryHandler, logger);
      logger.info('clean up and reconcile');
    } catch (e) {
      logger.error(util.format('fail to reconcile, %j', e));
      throw new Error(e);
    }
    readyToRunServer = true;

    return {
      addRedisRepository,
      getEntityNames: () => entityNames,
      getRedisRepos: () => redisRepos,
      getReducers: () => reducers,
      isReady: () => readyToRunServer,
      run,
      getQueryHandler: () => queryHandler,
      publisher,
      getServer: () => server,
      shutdown,
    };
  };

  return { addRedisRepository };
};
