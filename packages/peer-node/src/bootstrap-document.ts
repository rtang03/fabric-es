require('events').EventEmitter.defaultMaxListeners = 15;
import { buildFederatedSchema } from '@apollo/federation';
import {
  Document,
  DocumentEvent,
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
import { resolvers, typeDefs } from './document';
import './env';
import { DataSources, FabricData } from './types';

let networkConfig;
const port = 14003;
const collection = 'Org1PrivateDetails';

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping Document - Onchain  ♨️♨️');
  const enrollmentId = '';
  networkConfig = await getNetwork({ enrollmentId });
  const { reconcile, getRepository, subscribeHub } = createPeer({
    ...networkConfig,
    reducer: reduceToDocument,
    collection
  });
  const tradeRepo = getRepository<Trade, TradeEvent>({
    entityName: 'trade',
    reducer: reduceToTrade
  });
  const userRepo = getRepository<User, UserEvent>({
    entityName: 'user',
    reducer: reduceToUser
  });
  const documentRepo = getRepository<Document, DocumentEvent>({
    entityName: 'document',
    reducer: reduceToDocument
  });
  // Invoke the Fabric Channel Event Listener, based on .env variable CHANNEL_HUB
  await subscribeHub();

  // As a bootstrap process, clone on-chain Trade entity to local in-memory query DB, and restore final state with reduceToTrade
  // For production-grade, local in-memory query database, may refactor to using Redis, for better scalability
  await reconcile({ entityName: 'trade', reducer: reduceToTrade });
  await reconcile({ entityName: 'user', reducer: reduceToUser });
  await reconcile({ entityName: 'document', reducer: reduceToDocument });

  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    subscriptions: { path: '/graphql' },
    dataSources: (): DataSources => ({
      docDataSource: new FabricData({ repo: documentRepo }),
      tradeDataSource: new FabricData({ repo: tradeRepo }),
      userDataSource: new FabricData({ repo: userRepo })
    })
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
