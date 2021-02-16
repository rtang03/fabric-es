import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
import {
  createRepository,
  createPrivateRepository,
  getNetwork,
  getReducer,
  PrivateRepository,
  RedisRepository,
  Reducer,
  Repository,
  createQueryDatabase,
  RedisearchDefinition,
  Commit,
} from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Gateway, Network, Wallet } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import { Redisearch } from 'redis-modules-sdk';
import { createTrackingData, DataSrc } from '..';
import { Organization, OrgEvents, orgReducer } from '../admin';
import type { AddRedisRepository, FederatedService } from '../types';
import { composeRedisRepos, getLogger, shutdownApollo } from '.';
import { Selector } from 'reselect';

/**
 * @about entity microservice
 * @example [counter.unit-test.ts](https://github.com/rtang03/fabric-es/blob/master/packages/gateway-lib/src/__tests__/counter.unit-test.ts)
 * ```typescript
 *  // step 1: init service
 *  const { config, getRepository } = await createService({
 *    asLocalhost: true,
 *    channelName,
 *    connectionProfile,
 *    serviceName: 'counter',
 *    enrollmentId: orgAdminId,
 *    wallet,
 *    redisOptions,
 *  });
 *
 *  // step 2: configure service with Repository
 *  const modelApolloService = await config({ typeDefs, resolvers })
 *    .addRepository(getRepository<Counter, CounterEvent>(entityName, counterReduer))
 *    .create();
 *
 *  // step 3: run service
 *  await modeApolloService.listen({ port });
 * ```
 *
 * @params option
 * ```typescript
 * {
 *   // run as local host, when using docker-compose
 *   asLocalhost: boolean;
 *   enrollmentId: string
 *   // microservice name
 *   serviceName: string;
 *   // is a private data repository
 *   isPrivate: boolean;
 *   channelName: string;
 *   // path to connectionProfile
 *   connectionProfile: string;
 *   // Fabric file wallet
 *   wallet: Wallet;
 *   // redis option
 *   redisOptions: RedisOptions;
 * }
 * ```
 */
export const createService: (option: {
  channelName: string;
  connectionProfile: string;
  asLocalhost: boolean;
  enrollmentId: string;
  isPrivate?: boolean;
  redisOptions: RedisOptions;
  serviceName: string;
  wallet: Wallet;
}) => Promise<FederatedService> = async ({
  asLocalhost,
  channelName,
  connectionProfile,
  enrollmentId,
  isPrivate = false,
  redisOptions,
  serviceName,
  wallet,
}) => {
  const logger = getLogger('[gw-lib] createService.js');
  const client = new Redisearch(redisOptions);

  let networkConfig;
  let gateway: Gateway;
  let network: Network;
  let redisRepos: Record<string, RedisRepository> = {};

  // connect Redis
  try {
    await client.connect();
    logger.info('redis connected');
  } catch (e) {
    logger.error(util.format('fail to connect Redis, %j', e));
    throw new Error(e);
  }

  // prepare Fabric network connection
  try {
    networkConfig = await getNetwork({
      discovery: !isPrivate,
      asLocalhost,
      channelName,
      connectionProfile,
      wallet,
      enrollmentId,
    });

    logger.info('fabric connected');

    gateway = networkConfig.gateway;
    network = networkConfig.network;
  } catch (e) {
    logger.error(util.format('fail to obtain Fabric network config, %j', e));
    throw new Error(e);
  }

  const mspId = gateway?.getIdentity()?.mspId;
  logger.info('mspId: ', mspId);

  const getPrivateRepository = <TEntity, TEvent>(
    entityName: string,
    reducer: Reducer,
    parentName?: string
  ) =>
    createPrivateRepository<TEntity, TEvent>(
      entityName,
      reducer,
      {
        ...networkConfig,
        connectionProfile,
        channelName,
        wallet,
      },
      parentName
    );

  const getRepository = <TEntity, TEvent>(entityName: string, reducer: Reducer) =>
    createRepository<TEntity, TEvent>(entityName, reducer, {
      ...networkConfig,
      queryDatabase: createQueryDatabase(client, redisRepos),
      connectionProfile,
      channelName,
      wallet,
    });

  return {
    config: ({ typeDefs, resolvers }) => {
      const repositories: {
        entityName: string;
        repository: Repository | PrivateRepository;
      }[] = [];

      const create: (option?: {
        mspId?: string;
        playground?: boolean;
        introspection?: boolean;
      }) => ApolloServer = (option) => {
        const schema = buildFederatedSchema([{ typeDefs, resolvers }]);

        const args = mspId ? { mspId } : undefined;
        const flags = {
          playground: option?.playground,
          introspection: option?.introspection,
        };

        if (repositories.filter((element) => element.entityName === 'organization').length <= 0) {
          repositories.push({
            entityName: 'organization',
            repository: getRepository<Organization, OrgEvents>(
              'organization',
              getReducer<Organization, OrgEvents>(orgReducer)
            ),
          });
        }

        return new ApolloServer(
          Object.assign(
            {
              schema,
              dataSources: () =>
                repositories.reduce(
                  (obj, { entityName, repository }) => ({
                    ...obj,
                    [entityName]: new DataSrc({ repo: repository }),
                  }),
                  {}
                ),
              context: ({ req: { headers } }) =>
                Object.assign(
                  {
                    user_id: headers.user_id,
                    is_admin: headers.is_admin,
                    username: headers.username,
                  },
                  args,
                  {
                    trackingData: createTrackingData,
                  }
                ),
            },
            flags
          )
        );
      };

      const addRepository = <TEntity, TEvent>(entityName, reducer) => {
        const repository = getRepository<TEntity, TEvent>(entityName, reducer);
        repositories.push({
          entityName: repository.getEntityName(),
          repository,
        });
        return { create, addRepository, addPrivateRepository };
      };

      const addPrivateRepository = <TEntity, TEvent>(entityName, reducer, parentName) => {
        const repository = getPrivateRepository<TEntity, TEvent>(entityName, reducer, parentName);
        repositories.push({
          entityName: repository.getEntityName(),
          repository,
        });
        return { create, addPrivateRepository };
      };

      const addRedisRepository: <TInput, TItemInRedis, TOutput>(option: {
        entityName: string;
        fields: RedisearchDefinition<TInput>;
        preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
        postSelector?: Selector<TItemInRedis, TOutput>;
      }) => AddRedisRepository = ({ entityName, fields, preSelector, postSelector }) => {
        redisRepos = composeRedisRepos(
          client,
          redisRepos
        )({
          entityName,
          fields,
          preSelector,
          postSelector,
        });
        return { addRedisRepository, addRepository };
      };

      return { addRepository, addRedisRepository };
    },
    disconnect: () => gateway.disconnect(),
    getMspId: () => mspId,
    getRedisRepos: () => redisRepos,
    getRepository,
    getPrivateRepository,
    getServiceName: () => serviceName,
    shutdown: shutdownApollo({ redis: client.redis, logger, name: serviceName }),
  };
};
