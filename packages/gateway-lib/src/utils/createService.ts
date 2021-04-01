import util from 'util';
// import { buildFederatedSchema } from '@apollo/federation';
import {
  createRepository,
  createPrivateRepository,
  getNetwork,
  PrivateRepository,
  RedisRepository,
  Repository,
  createQueryDatabase,
  RedisearchDefinition,
  Commit,
  EntityType,
  ReducerCallback
} from '@fabric-es/fabric-cqrs';
import { GraphQLResolverMap } from 'apollo-graphql';
import { ApolloServer } from 'apollo-server';
import { Gateway, Network, Wallet } from 'fabric-network';
import { DocumentNode } from 'graphql';
import type { RedisOptions } from 'ioredis';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';
import { DataSrc } from '..';
import { Organization, OrgEvents, orgReducer, orgIndices, User, UserEvents, userReducer, userIndices } from '../common/model';
import { AddRepository, AddRemoteRepository, FederatedService, ServiceType } from '../types';
import { buildCatalogedSchema } from './catalog';
import { composeRedisRepos, getLogger, shutdownApollo } from '.';

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
  type?: ServiceType;
  redisOptions: RedisOptions;
  serviceName: string;
  wallet: Wallet;
}) => Promise<FederatedService> = async ({
  asLocalhost,
  channelName,
  connectionProfile,
  enrollmentId,
  type = ServiceType.Public,
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
      discovery: (type !== ServiceType.Private), // only for non-private repo
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
    entity: EntityType<TEntity>,
    reducer: ReducerCallback<TEntity, TEvent>,
  ) =>
    createPrivateRepository<TEntity, TEvent>(
      entity,
      reducer,
      {
        ...networkConfig,
        connectionProfile,
        channelName,
        wallet,
      },
    );

  const getRepository = <TEntity, TOutput, TEvent>(entity: EntityType<TEntity>, reducer: ReducerCallback<TEntity, TEvent>) =>
    createRepository<TEntity, TOutput, TEvent>(entity, reducer, {
      ...networkConfig,
      queryDatabase: createQueryDatabase(client, redisRepos),
      connectionProfile,
      channelName,
      wallet,
    });

  return {
    config: (sdl: {
      typeDefs: DocumentNode;
      resolvers: GraphQLResolverMap<any>;
    }[]) => {
      const repositories: {
        entityName: string;
        repository: Repository | PrivateRepository;
      }[] = [];

      const create: (option?: {
        mspId?: string;
        playground?: boolean;
        introspection?: boolean;
        catalog?: boolean;
      }) => ApolloServer = (option) => {
        const schema = buildCatalogedSchema(serviceName, option ? option.catalog : true, sdl);

        const args = mspId ? { mspId } : undefined;
        const flags = {
          playground: option?.playground,
          introspection: option?.introspection,
        };

        // if (repositories.filter((element) => element.entityName === Organization.entityName).length <= 0) {
        redisRepos = composeRedisRepos(client, redisRepos)(Organization, { fields: orgIndices});
        redisRepos = composeRedisRepos(client, redisRepos)(User, { fields: userIndices});
        repositories.push({
          entityName: Organization.entityName, repository: getRepository<Organization, Organization, OrgEvents>(Organization, orgReducer),
        }, {
          entityName: User.entityName, repository: getRepository<User, User, UserEvents>(User, userReducer),
        });
        // }

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
                    ...headers,
                    user_id: headers.user_id,
                    is_admin: headers.is_admin,
                    username: headers.username,
                    serviceName,
                    serviceType: type,
                  },
                  args,
                ),
            },
            flags
          )
        );
      };

      const addPrivateRepository = <TEntity, TEvent>(entity, reducer) => {
        if (type !== ServiceType.Private) throw new Error('Invlid operation for non-private repo');

        const repository = getPrivateRepository<TEntity, TEvent>(entity, reducer);
        repositories.push({
          entityName: repository.getEntityName(),
          repository,
        });
        return { create, addRepository, addPrivateRepository };
      };

      const addRepository: <TEntity, TRedis, TOutput, TEvent>(
        entity: EntityType<TEntity>,
        option: {
          reducer: ReducerCallback<TEntity, TEvent>;
          fields: RedisearchDefinition<TEntity>;
          preSelector?: Selector<[TEntity, Commit[]?], TRedis>;
          postSelector?: Selector<TRedis, TOutput>;
      }) => AddRepository = (entity, { reducer, fields, preSelector, postSelector }) => {
        redisRepos = composeRedisRepos(
          client,
          redisRepos
        )(entity, {
          fields,
          preSelector,
          postSelector,
        });

        const repository = getRepository(entity, reducer);
        repositories.push({
          entityName: entity.entityName,
          repository,
        });

        return { create, addRepository, addPrivateRepository };
      };

      const addRemoteRepository: <TParent, TEntity, TRedis, TOutput, TEvent>(
        parent: EntityType<TParent>,
        entity: EntityType<TEntity>,
        option: {
          reducer: ReducerCallback<TParent, TEvent>;
          fields: RedisearchDefinition<TParent>;
          preSelector?: Selector<[TParent, Commit[]?], TRedis>;
          postSelector?: Selector<TRedis, TOutput>;
      }) => AddRemoteRepository = (parent, entity, option) => {
        if (type !== ServiceType.Remote) throw new Error('Invlid operation for non-remote repo');
        if (!entity.parentName || entity.parentName !== parent.entityName)
          throw new Error(`invalid 'parentName' in entity '${entity.entityName}'`);

        addRepository(parent, option);
        return { create, addRemoteRepository };
      };

      // const addRedisRepository: <TInput, TItemInRedis, TOutput>(
      //   entity: EntityType<TInput>,
      //   option: {
      //     fields: RedisearchDefinition<TInput>;
      //     preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
      //     postSelector?: Selector<TItemInRedis, TOutput>;
      // }) => AddRedisRepository = (entity, { fields, preSelector, postSelector }) => {
      //   redisRepos = composeRedisRepos(
      //     client,
      //     redisRepos
      //   )(entity, {
      //     fields,
      //     preSelector,
      //     postSelector,
      //   });
      //   return { addRedisRepository, addRepository };
      // };

      return { addRepository, addPrivateRepository, addRemoteRepository };
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
