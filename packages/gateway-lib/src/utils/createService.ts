import { createHash } from 'crypto';
import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
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
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { GraphQLResolverMap } from 'apollo-graphql';
import { ApolloServer } from 'apollo-server';
import EC from 'elliptic';
import { Gateway, Network, Wallet } from 'fabric-network';
import { DocumentNode } from 'graphql';
import type { RedisOptions } from 'ioredis';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';
import { DataSrc } from '..';
import { Organization, OrgEvents, orgReducer, orgIndices, User, UserEvents, userReducer, userIndices } from '../common/model';
import { AddRepository, AddRemoteRepository, FederatedService, ServiceType } from '../types';
import { buildCatalogedSchema } from './catalog';
import { composeRedisRepos, getLogger, shutdownApollo, normalizeReq, getAclTypeDefs, getAclResolver } from '.';

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
  keyPath?: string;
  aclPath?: string;
}) => Promise<FederatedService> = async ({
  asLocalhost,
  channelName,
  connectionProfile,
  enrollmentId,
  type = ServiceType.Public,
  redisOptions,
  serviceName,
  wallet,
  keyPath,
  aclPath,
}) => {
  const logger = getLogger('[gw-lib] createService.js');
  const client = new Redisearch(redisOptions);
  const ec = new EC.ec('secp256k1');

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

  // const aclDbPath = (aclPath) ? `${aclPath}${aclPath.endsWith('/') ? '' : '/'}${serviceName}.db` : undefined;

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
        isPrivate: boolean;
      }[] = [];

      const create: (option?: {
        mspId?: string;
        playground?: boolean;
        introspection?: boolean;
        catalog?: boolean;
      }) => ApolloServer = (option) => {
        // const sdls = [];
        // let csdl = ((option && option.catalog) || !option) ? buildCatalogedSchema(serviceName, type, sdl) : combinSchema({sdls: sdl}); // TODO: here assume using default names for the root operations
        // if (csdl) sdls.push(csdl);
        // if (type === ServiceType.Private) {
        //   sdls.push({
        //    typeDefs: getAclTypeDefs(serviceName),
        //    resolvers: getAclResolver(serviceName),
        //   });
        //   csdl = combinSchema({sdls}); // TODO: here assume using default names for the root operations
        // }
        // const schema = buildFederatedSchema(csdl);
        if (type === ServiceType.Private) {
          for (const repo of repositories) {
            if (repo.isPrivate) {
              sdl.push({
                typeDefs: getAclTypeDefs(repo.entityName),
                resolvers: getAclResolver(repo.entityName, repo.repository as PrivateRepository),
              });
            }
          }
        }
        const sdls = {
          typeDefs: mergeTypeDefs(sdl.map(s => s.typeDefs)),
          resolvers: mergeResolvers(sdl.map(s => s.resolvers)),
        };
        const schema = buildFederatedSchema(((option && option.catalog) || !option) ? buildCatalogedSchema(serviceName, type, sdls) : sdls);
        //

        const args = mspId ? { mspId } : undefined;
        const flags = {
          playground: option?.playground,
          introspection: option?.introspection,
        };

        redisRepos = composeRedisRepos(client, redisRepos)(Organization, { fields: orgIndices});
        redisRepos = composeRedisRepos(client, redisRepos)(User, { fields: userIndices});
        repositories.push({
          entityName: Organization.entityName, repository: getRepository<Organization, Organization, OrgEvents>(Organization, orgReducer), isPrivate: false,
        }, {
          entityName: User.entityName, repository: getRepository<User, User, UserEvents>(User, userReducer), isPrivate: false,
        });

        return new ApolloServer(
          Object.assign(
            {
              schema,
              dataSources: () =>
                repositories.reduce(
                  (obj, { entityName, repository, isPrivate }) => ({
                    ...obj,
                    [entityName]: (isPrivate) ? new DataSrc({ repo: repository, isPrivate: true }) : new DataSrc({ repo: repository }),
                  }),
                  {}
                ),
              context: async ({ req }) => {
                if (type === ServiceType.Private) {
                  const queries = /^query.*?[{][\s]*?(.*?)[ ({].*$/g.exec(req.body.query.replace(/\s*[\n\r]+\s*/g, ' '));
                  const query = (queries && queries.length > 1) ? queries[1] : undefined;
                  const variables = query ? req.body.variables : undefined;

                  // For requests made from 'remoteData', verify the signature (plus check acl) to determine the access right
                  if (query && req.headers.accessor && req.headers.signature) {
                    const hash = query ? createHash('sha256').update(normalizeReq(query, variables)).digest('hex') : undefined;

                    // Get public key
                    const repos = repositories.filter(r => r.entityName === Organization.entityName);
                    if (repos.length > 0 && (repos[0].repository as Repository).fullTextSearchEntity) {
                      const org = await (repos[0].repository as Repository).fullTextSearchEntity({
                        entityName: Organization.entityName,
                        query: `@id:${req.headers.accessor}`,
                        cursor: 0,
                        pagesize: 1,
                      });
                      if (org.status === 'OK' && org.data?.items[0].pubkey) {
                        return Object.assign({
                          ...req.headers,
                          hash,
                          serviceName,
                          serviceType: type,
                          ec,
                          pubkey: org.data?.items[0].pubkey,
                        }, args);
                      }
                    }
                  }

                  // For requests not made thru 'remoteData', use the bearer token for authentication
                  return Object.assign({
                    ...req.headers,
                    serviceName,
                    serviceType: type,
                    ec,
                    keyPath,
                  }, args);
                } else if (type === ServiceType.Remote) {
                  return Object.assign(
                    {
                      ...req.headers,
                      serviceName,
                      serviceType: type,
                      ec,
                      keyPath,
                    }, args);
                } else {
                  return Object.assign(
                    {
                      ...req.headers,
                      serviceName,
                      serviceType: type,
                    },
                    args,
                  );
                }
              },
            },
            flags
          )
        );
      };

      const addPrivateRepository = <TEntity, TEvent>(entity, reducer) => {
        // NOTE: in response to Jack's request
        // if (type !== ServiceType.Private) throw new Error('Invlid operation for non-private repo');

        const repository = getPrivateRepository<TEntity, TEvent>(entity, reducer);
        repositories.push({
          entityName: repository.getEntityName(),
          repository,
          isPrivate: true,
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
          isPrivate: false,
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
