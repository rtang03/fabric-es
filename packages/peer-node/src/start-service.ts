require('./env');
import { buildFederatedSchema } from '@apollo/federation';
import { createPeer, getNetwork, PeerOptions, PrivatedataRepository, Repository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/model-loan';
import { ApolloServer } from 'apollo-server';

export const prepare = async ({
  enrollmentId,
  defaultEntityName,
  defaultReducer
}: {
  enrollmentId: string;
  defaultEntityName: string;
  defaultReducer: any;
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

  return {
    networkConfig,
    enrollmentId,
    reconcile,
    getRepository,
    getPrivateDataRepo,
    subscribeHub,
    defaultEntityName,
    defaultReducer
  };
};

export const bootstrap = async ({
  port,
  typeDefs,
  resolvers,
  repositories,
  reconcile,
  subscribeHub,
  networkConfig,
  enrollmentId,
  defaultEntityName,
  defaultReducer
}: {
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
  networkConfig: any;
  defaultEntityName?: string;
  defaultReducer?: any;
}) => {
  bootstrap3({
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
};

const bootstrap3 = async ({
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
  if (reconcile && subscribeHub) {
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