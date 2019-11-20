require('events').EventEmitter.defaultMaxListeners = 15;
import { buildFederatedSchema } from '@apollo/federation';
import {
  Document,
  DocumentEvents,
  documentReducer,
  Loan,
  LoanEvents,
  loanReducer,
  User,
  UserEvents,
  userReducer
} from '@espresso/common';
import { createPeer, getNetwork } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { resolvers, typeDefs } from './common/document';
import './env';
import { DataSources, FabricData } from './types';

let networkConfig;
const port = 14003;
const collection = 'Org1PrivateDetails';

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping Document - Onchain  ♨️♨️');
  const enrollmentId = 'admin';
  networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });
  const { reconcile, getRepository, subscribeHub } = createPeer({
    ...networkConfig,
    reducer: documentReducer,
    collection
  });
  const loanRepo = getRepository<Loan, LoanEvents>({
    entityName: 'loan',
    reducer: loanReducer
  });
  const userRepo = getRepository<User, UserEvents>({
    entityName: 'user',
    reducer: userReducer
  });
  const documentRepo = getRepository<Document, DocumentEvents>({
    entityName: 'document',
    reducer: documentReducer
  });
  // Invoke the Fabric Channel Event Listener, based on .env variable CHANNEL_HUB
  await subscribeHub();

  // As a bootstrap process, clone on-chain Trade entity to local in-memory query DB, and restore final state with reduceToTrade
  // For production-grade, local in-memory query database, may refactor to using Redis, for better scalability
  await reconcile({ entityName: 'loan', reducer: loanReducer });
  await reconcile({ entityName: 'user', reducer: userReducer });
  await reconcile({ entityName: 'document', reducer: documentReducer });

  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    subscriptions: { path: '/graphql' },
    dataSources: (): DataSources => ({
      docDataSource: new FabricData({ repo: documentRepo }),
      loanDataSource: new FabricData({ repo: loanRepo }),
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
