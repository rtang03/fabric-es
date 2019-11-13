// require('events').EventEmitter.defaultMaxListeners = 15;
import { buildFederatedSchema } from '@apollo/federation';
import {
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
import { resolvers, typeDefs } from './common/loan';
import './env';
import { DataSources, FabricData } from './types';

const port = 14001;
let networkConfig;

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping Loan - Onchain  ♨️♨️');
  const enrollmentId = 'admin';
  networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });
  // note: the default reducer is documentReducer
  const { reconcile, getRepository, subscribeHub } = createPeer({
    ...networkConfig,
    reducer: documentReducer,
    collection: 'Org1PrivateDetails'
  });
  const loanRepo = getRepository<Loan, LoanEvents>({
    entityName: 'loan',
    reducer: loanReducer
  });
  const userRepo = getRepository<User, UserEvents>({
    entityName: 'user',
    reducer: userReducer
  });
  await subscribeHub();
  await reconcile({ entityName: 'loan', reducer: loanReducer });
  await reconcile({ entityName: 'user', reducer: userReducer });

  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    dataSources: (): DataSources => ({
      loanDataSource: new FabricData({ repo: loanRepo }),
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
