import { buildFederatedSchema } from '@apollo/federation';
import {
  createPeer,
  getNetwork,
  PeerOptions,
  PrivatedataRepository,
  Reducer,
  Repository
} from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/model-common';
import { ApolloServer } from 'apollo-server';

export const createService = async ({
  enrollmentId,
  defaultEntityName,
  defaultReducer,
  collection,
  isPrivate = false
}: {
  enrollmentId: string;
  defaultEntityName: string;
  defaultReducer: Reducer;
  collection: string;
  isPrivate?: boolean;
}) => {
  const networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });

  const {
    reconcile,
    getRepository,
    getPrivateDataRepo,
    subscribeHub
  } = createPeer({
    ...(networkConfig as Partial<PeerOptions>),
    defaultEntityName,
    defaultReducer,
    collection
  });

  const result = isPrivate ? { getPrivateDataRepo } : { getRepository };

  return {
    ...result,
    config: ({ typeDefs, resolvers }) => {
      const repositories: Array<{
        entityName: string;
        repository: Repository | PrivatedataRepository;
      }> = [];

      async function create(): Promise<ApolloServer> {
        if (!isPrivate) {
          console.log(
            `♨️♨️  Starting micro-service for on-chain entity '${defaultEntityName}'...`
          );
          await subscribeHub();
          await reconcile({ entityName: defaultEntityName, reducer: defaultReducer });
        } else
          console.log(
            `♨️♨️  Starting micro-service for off-chain private data...`
          );
      
        const server = new ApolloServer({
          schema: buildFederatedSchema([{ typeDefs, resolvers }]),
          playground: true,
          dataSources: () =>
            repositories.reduce(
              (obj, { entityName, repository }) => ({
                ...obj,
                [entityName]: new DataSrc({ repo: repository })
              }),
              {}
            ),
          context: ({ req: { headers } }) => {
            return {
              user_id: headers.user_id,
              is_admin: headers.is_admin,
              client_id: headers.client_id,
              enrollmentId: headers.user_id
            };
          }
        });

        return server;
      }

      function addRepository(repository: Repository | PrivatedataRepository) {
        repositories.push({
          entityName: repository.getEntityName(),
          repository
        });
        return { create, addRepository };
      }

      return { addRepository };
    }
  };
};