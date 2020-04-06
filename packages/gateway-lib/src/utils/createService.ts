import util from 'util';
import { buildFederatedSchema } from '@apollo/federation';
import {
  createPeer,
  getNetwork,
  PeerOptions,
  PrivatedataRepository,
  Reducer,
  Repository
} from '@fabric-es/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import Client from 'fabric-client';
import { Wallet } from 'fabric-network';
import { shutdown } from './shutdownApollo';
import { DataSrc } from '..';

export const createService = async ({
  enrollmentId,
  defaultEntityName,
  defaultReducer,
  isPrivate = false,
  channelName,
  connectionProfile,
  wallet
}: {
  enrollmentId: string;
  defaultEntityName: string;
  defaultReducer: Reducer;
  isPrivate?: boolean;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
}) => {
  const logger = Client.getLogger('createService.js');

  const networkConfig = await getNetwork({
    discovery: true,
    channelName,
    connectionProfile,
    wallet,
    enrollmentId
  });

  const { reconcile, getRepository, getPrivateDataRepo, subscribeHub, unsubscribeHub, disconnect } = createPeer({
    ...networkConfig,
    defaultEntityName,
    defaultReducer,
    channelName,
    connectionProfile,
    wallet
  });

  const result = isPrivate ? { getPrivateDataRepo } : { getRepository };

  return {
    ...result,
    config: ({ typeDefs, resolvers }) => {
      const repositories: {
        entityName: string;
        repository: Repository | PrivatedataRepository;
      }[] = [];

      const create: () => Promise<ApolloServer> = async () => {
        const schema = buildFederatedSchema([{ typeDefs, resolvers }]);
        if (!isPrivate) {
          logger.info(`♨️♨️  Starting micro-service for on-chain entity '${defaultEntityName}'...`);

          try {
            subscribeHub();
          } catch (error) {
            logger.error(util.format('fail to subscribeHub and exiting:, %j', error));
            process.exit(1);
          }

          logger.info('subscribe event hub complete');

          try {
            await reconcile({
              entityName: defaultEntityName,
              reducer: defaultReducer
            });
          } catch (error) {
            logger.error(util.format('fail to reconcile, exiting:, %j', error));
            process.exit(1);
          }

          logger.info(`reconcile complete: ${defaultEntityName}`);
        } else {
          logger.info(`♨️♨️  Starting micro-service for off-chain private data...`);
        }

        return new ApolloServer({
          schema,
          playground: true,
          dataSources: () =>
            repositories.reduce(
              (obj, { entityName, repository }) => ({
                ...obj,
                [entityName]: new DataSrc({ repo: repository })
              }),
              {}
            ),
          context: ({ req: { headers } }) => ({
            user_id: headers.user_id,
            is_admin: headers.is_admin,
            client_id: headers.client_id,
            enrollmentId: headers.user_id
          })
        });
      };

      const addRepository = (repository: Repository | PrivatedataRepository) => {
        repositories.push({
          entityName: repository.getEntityName(),
          repository
        });
        return { create, addRepository };
      };

      return { addRepository };
    },
    shutdown: shutdown({ logger, name: defaultEntityName }),
    unsubscribeHub: !isPrivate ? unsubscribeHub : null,
    disconnect
  };
};
