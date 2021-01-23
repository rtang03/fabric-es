import { buildFederatedSchema } from '@apollo/federation';
import {
  createRepository,
  createPrivateRepository,
  getNetwork,
  getReducer,
  PrivateRepository,
  Reducer,
  Repository,
  createQueryDatabase,
} from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Gateway, Network, Wallet } from 'fabric-network';
import Redis, { RedisOptions } from 'ioredis';
import { createTrackingData, DataSrc } from '..';
import { Organization, OrgEvents, orgReducer } from '../admin';
import { getLogger } from './getLogger';
import { shutdownApollo } from './shutdownApollo';

interface AddRepository {
  create: (option?: {
    mspId?: string;
    playground?: boolean;
    introspection?: boolean;
  }) => Promise<ApolloServer>;
  addRepository: (repository: Repository | PrivateRepository) => this;
}

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
 *   // microserver name
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
  enrollmentId: string;
  serviceName: string;
  isPrivate?: boolean;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
  asLocalhost: boolean;
  redisOptions: RedisOptions;
}) => Promise<{
  mspId: string;
  getRepository: <TEntity, TEvent>(entityName: string, reducer: Reducer) => Repository<TEntity, TEvent>;
  getPrivateRepository: <TEntity, TEvent>(
    entityName: string, reducer: Reducer, parentName?: string
  ) => PrivateRepository<TEntity, TEvent>;
  config: (option: { typeDefs: any; resolvers: any }) => {
    addRepository: (repository: Repository | PrivateRepository) => AddRepository;
  };
  getServiceName: () => string;
  shutdown: (server: ApolloServer) => Promise<void>;
  disconnect: () => void;
}> = async ({
  enrollmentId,
  serviceName,
  isPrivate = false,
  channelName,
  connectionProfile,
  wallet,
  asLocalhost,
  redisOptions,
}) => {
  const logger = getLogger('[gw-lib] createService.js');

  const networkConfig: {
    enrollmentId: string;
    network: Network;
    gateway: Gateway;
  } = await getNetwork({
    discovery: !isPrivate,
    asLocalhost,
    channelName,
    connectionProfile,
    wallet,
    enrollmentId,
  });
  const mspId =
    networkConfig && networkConfig.gateway && networkConfig.gateway.getIdentity
      ? networkConfig.gateway.getIdentity().mspId
      : undefined;

  const redis = new Redis(redisOptions);

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
      queryDatabase: createQueryDatabase(redis),
      connectionProfile,
      channelName,
      wallet,
    });

  return {
    mspId,
    getRepository,
    getPrivateRepository,
    config: ({ typeDefs, resolvers }) => {
      const repositories: {
        entityName: string;
        repository: Repository | PrivateRepository;
      }[] = [];

      const create: (option?: {
        mspId?: string;
        playground?: boolean;
        introspection?: boolean;
      }) => Promise<ApolloServer> = async (option) => {
        const schema = buildFederatedSchema([{ typeDefs, resolvers }]);

        const args = mspId ? { mspId } : undefined;
        const flags = {
          playground: option && option.playground,
          introspection: option && option.introspection,
        };

        if (repositories.filter((element) => element.entityName === 'organization').length <= 0) {
          // TODO
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

      const addRepository = (repository: Repository | PrivateRepository) => {
        repositories.push({
          entityName: repository.getEntityName(),
          repository,
        });
        return { create, addRepository };
      };

      return { addRepository };
    },
    getServiceName: () => serviceName,
    shutdown: shutdownApollo({ redis, logger, name: serviceName }),
    disconnect: () => networkConfig.gateway.disconnect(),
  };
};
