import { buildFederatedSchema } from '@apollo/federation';
import { DataSrc } from '@espresso/common';
import { createPeer, getNetwork, PeerOptions } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';

const _bootstrap = async <E, V>(networkConfig, entityName, port, enrollmentId, reducer, typeDefs, resolvers) => {
  console.log(`♨️♨️  Bootstraping on-chain entity '${entityName}' for '${process.env.ORGNAME}'...`);

  const { reconcile, getRepository, subscribeHub } = createPeer({
    ...(networkConfig as Partial<PeerOptions>),
    defaultEntityName: entityName,
    defaultReducer: reducer,
    collection: process.env.COLLECTION
  });

  const repository = getRepository<E, V>({ entityName, reducer });
  await subscribeHub();
  await reconcile({ entityName, reducer });

  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    dataSources: () => ({
      [entityName]: new DataSrc({ repo: repository })
    }),
    context: ({ req }) => {
      console.log(`${req.headers.client_id} is authenticated.`);
      return {
        enrollmentId
      };
    }
  });

  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 '${process.env.ORGNAME}' - '${entityName}' ready at ${url}`);
  });
};

export const bootstrap = async <E, V>({
  entityName,
  port,
  enrollmentId,
  reducer,
  typeDefs,
  resolvers
}: {
  entityName: string;
  port: number;
  enrollmentId: string;
  reducer: any;
  typeDefs: any;
  resolvers:any;
}) => {
  const networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });

  _bootstrap(networkConfig, entityName, port, enrollmentId, reducer, typeDefs, resolvers)
    .catch(error => {
      console.log(error);
      console.error(error.stack);
      networkConfig.gateway.disconnect();
      process.exit(0);
    });
};
