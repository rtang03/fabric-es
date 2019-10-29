// require('events').EventEmitter.defaultMaxListeners = 15;
import { buildFederatedSchema } from '@apollo/federation';
import {
  reduceToDocument,
  reduceToTrade,
  reduceToUser,
  Trade,
  TradeEvent,
  User,
  UserEvent
} from '@espresso/common';
import { createPeer, getNetwork } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import './env';
import { resolvers, typeDefs } from './trade';
import { DataSources, FabricData } from './types';

const port = 14001;
let networkConfig;

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping Trade - Onchain  ♨️♨️');
  const enrollmentId = 'admin';
  networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });
  // note: the default reducer is reduceToDocument
  const { reconcile, getRepository, subscribeHub } = createPeer({
    ...networkConfig,
    reducer: reduceToDocument,
    collection: 'Org1PrivateDetails'
  });
  const tradeRepo = getRepository<Trade, TradeEvent>({
    entityName: 'trade',
    reducer: reduceToTrade
  });
  const userRepo = getRepository<User, UserEvent>({
    entityName: 'user',
    reducer: reduceToUser
  });
  await subscribeHub();
  await reconcile({ entityName: 'trade', reducer: reduceToTrade });
  await reconcile({ entityName: 'user', reducer: reduceToUser });

  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    dataSources: (): DataSources => ({
      tradeDataSource: new FabricData({ repo: tradeRepo }),
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
