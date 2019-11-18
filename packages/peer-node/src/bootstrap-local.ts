// NodeJS event emitter is used to listen event arrival from on-chain write operation.
// This is default implementation of PubSub() of GraphQL Subscription
// For production-grade, other PubSub, e.g. Redis may replace event emmitter, in fabric-rx-cqrs
// Thereafter, below line is no longer required.
require('events').EventEmitter.defaultMaxListeners = 15;
import { buildFederatedSchema } from '@apollo/federation';
import { createPeer, getNetwork } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import './env';
import { LoanDetails, LoanDetailsEvents, loanDetailsReducer, resolvers, typeDefs } from './local';
import { FabricData } from './types';

let networkConfig;
const port = 14002;
const entityName = 'privatedata';
const collection = 'Org1PrivateDetails';

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping Doc-Etc - Offchain ♨️♨️');
  const enrollmentId = 'admin';
  networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });
  const { getPrivateDataRepo } = createPeer({
    ...networkConfig,
    reducer: loanDetailsReducer,
    collection
  });
  const dtlsRepo = getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
    entityName,
    reducer: loanDetailsReducer
  });
  const dtlsDataSource = new FabricData({ localRepo: dtlsRepo });
  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    dataSources: () => ({ dtlsDataSource })
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
