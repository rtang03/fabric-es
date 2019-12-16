import { buildFederatedSchema } from '@apollo/federation';
import { createPeer, getNetwork, PeerOptions, PrivatedataRepository, Reducer, Repository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/model-common';
import { ApolloServer } from 'apollo-server';

export const startService = async ({
  enrollmentId,
  defaultEntityName,
  defaultReducer,
  isPrivate = false
}: {
  enrollmentId: string;
  defaultEntityName: string;
  defaultReducer: Reducer;
  isPrivate?: boolean;
}) => {
  const networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });

  const { reconcile, getRepository, getPrivateDataRepo, subscribeHub } = createPeer({
    ...(networkConfig as Partial<PeerOptions>),
    defaultEntityName,
    defaultReducer,
    collection: process.env.COLLECTION
  });

  const result = (isPrivate) ? {
    getPrivateDataRepo
  } : {
    getRepository
  };

  return {
    ...result,
    config: ({port, typeDefs, resolvers}) => {
      const repositories: Array<{ entityName: string, repository: Repository | PrivatedataRepository }> = [];

      async function run() {
        _start({
          isPrivate,
          port,
          typeDefs,
          resolvers,
          repositories,
          reconcile,
          subscribeHub,
          enrollmentId,
          defaultEntityName,
          defaultReducer
        }).catch(error => {
          console.log(error);
          console.error(error.stack);
          networkConfig.gateway.disconnect();
          process.exit(0);
        });
      }

      function addRepository(repository: Repository | PrivatedataRepository) {
        repositories.push({ entityName: repository.getEntityName(), repository });
        return {
          run,
          addRepository
        };
      }

      return {
        addRepository
      };
    }
  };
};

const _start = async ({
  isPrivate,
  port,
  typeDefs,
  resolvers,
  repositories,
  reconcile,
  subscribeHub,
  enrollmentId,
  defaultEntityName,
  defaultReducer
}: {
  isPrivate: boolean;
  port: number;
  typeDefs: any;
  resolvers: any;
  repositories: Array<{
    entityName: string,
    repository: Repository | PrivatedataRepository
  }>;
  reconcile?: any;
  subscribeHub?: any;
  enrollmentId: string;
  defaultEntityName?: string;
  defaultReducer?: any;
}) => {
  if (!isPrivate) {
    console.log(`♨️♨️  '${process.env.ORGNAME}' - Starting micro-service for on-chain entity '${defaultEntityName}'...`);
    await subscribeHub();
    await reconcile({ entityName: defaultEntityName, reducer: defaultReducer });
  } else {
    console.log(`♨️♨️  '${process.env.ORGNAME}' - Starting micro-service for off-chain private data...`);
  }

  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    dataSources: () =>
      repositories.reduce((obj, item) => {
        return {
          ...obj,
          [item.entityName]: new DataSrc({ repo: item.repository })
        };
      }, {}),
    context: ({ req }) => {
      // console.log(`${req.headers.client_id} is authenticated.`);
      return {
        enrollmentId
      };
    }
  });

  server.listen({ port }).then(({ url }) => {
    console.log(`🚀  '${process.env.ORGNAME}' - '${defaultEntityName}' available at ${url}`);
  });
};
