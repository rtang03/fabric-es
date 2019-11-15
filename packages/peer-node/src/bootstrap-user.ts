import { User, UserEvents, userReducer } from '@espresso/common';
import { createPeer, getNetwork } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { resolvers, typeDefs } from './common/user';
import './env';
import { DataSources, FabricData } from './types';

const port = 14004;
let networkConfig;

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping User - Onchain  ♨️♨️');
  const enrollmentId = 'admin';
  networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });
  
  const { reconcile, getRepository, subscribeHub } = createPeer({
    ...networkConfig,
    reducer: userReducer,
    collection: 'Org1PrivateDetails'
  });
  const userRepo = getRepository<User, UserEvents>({
    entityName: 'user',
    reducer: userReducer
  });
  await subscribeHub();
  await reconcile({ entityName: 'user', reducer: userReducer });

  const server = new ApolloServer({
    typeDefs, resolvers,
    playground: true,
    dataSources: (): DataSources => ({
      userDataSource: new FabricData({ repo: userRepo })
    }),
    context: ({ req }) => {
      console.log(`${req.headers.client_id} is authenticated.`);
      return {
        enrollmentId: 'admin'
      };
    }
  });

  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};

bootstrap().catch(error => {
  console.log(error);
  console.error(error.stack);
  networkConfig.gateway.disconnect();
  process.exit(0);
});
