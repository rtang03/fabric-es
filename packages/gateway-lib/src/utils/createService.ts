import { buildFederatedSchema } from '@apollo/federation';
import {
  createRepository,
  createPrivateRepository,
  getNetwork,
  PrivateRepository,
  Reducer,
  Repository,
  createQueryDatabase,
} from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { Wallet } from 'fabric-network';
import type { Redis } from 'ioredis';
import { DataSrc } from '..';
import type { ModelService } from '../types';
import { getLogger } from './getLogger';
import { shutdown } from './shutdownApollo';

export const createService: (option: {
  enrollmentId: string;
  serviceName: string;
  isPrivate?: boolean;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
  asLocalhost: boolean;
  redis: Redis;
}) => Promise<ModelService> = async ({
  enrollmentId,
  serviceName,
  isPrivate = false,
  channelName,
  connectionProfile,
  wallet,
  asLocalhost,
  redis,
}) => {
  const logger = getLogger('[gw-lib] createService.js');

  const networkConfig = await getNetwork({
    discovery: !isPrivate,
    asLocalhost,
    channelName,
    connectionProfile,
    wallet,
    enrollmentId,
  });

  const getPrivateRepository = <TEntity, TEvent>(entityName: string, reducer: Reducer, parentName?: string) =>
    createPrivateRepository<TEntity, TEvent>(entityName, reducer, {
      ...networkConfig,
      connectionProfile,
      channelName,
      wallet,
    }, parentName);

  const getRepository = <TEntity, TEvent>(entityName: string, reducer: Reducer) =>
    createRepository<TEntity, TEvent>(entityName, reducer, {
      ...networkConfig,
      queryDatabase: createQueryDatabase(redis),
      connectionProfile,
      channelName,
      wallet,
    });

  return {
    getRepository,
    getPrivateRepository,
    config: ({ typeDefs, resolvers }) => {
      const repositories: {
        entityName: string;
        repository: Repository | PrivateRepository;
      }[] = [];

      const create: () => Promise<ApolloServer> = async () => {
        const schema = buildFederatedSchema([{ typeDefs, resolvers }]);

        return new ApolloServer({
          schema,
          playground: true,
          dataSources: () =>
            repositories.reduce(
              (obj, { entityName, repository }) => ({
                ...obj,
                [entityName]: new DataSrc({ repo: repository }),
              }),
              {}
            ),
          context: ({ req: { headers } }) => ({
            user_id: headers.user_id,
            is_admin: headers.is_admin,
            username: headers.username,
          }),
        });
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
    shutdown: shutdown({ logger, name: serviceName }),
    disconnect: () => networkConfig.gateway.disconnect(),
  };
};
