// NodeJS event emitter is used to listen event arrival from on-chain write operation.
// This is default implementation of PubSub() of GraphQL Subscription
// For production-grade, other PubSub, e.g. Redis may replace event emmitter, in fabric-rx-cqrs
// Thereafter, below line is no longer required.
require('events').EventEmitter.defaultMaxListeners = 15;
import { buildFederatedSchema } from '@apollo/federation';
import { createPeer, getNetwork } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import './env';
import { EtcPo, EtcPoEvent, resolvers, typeDefs } from './privatedata';
import { reduceToEtcPo } from './privatedata/domain/etc-po';
import { FabricData } from './types';

let networkConfig;
const port = 14002;
const entityName = 'etcPo';
const collection = 'Org1PrivateDetails';

const bootstrap = async () => {
  console.log('♨️♨️ Bootstraping Doc-Etc - Offchain ♨️♨️');
  const enrollmentId = '';
  networkConfig = await getNetwork({ enrollmentId });
  const { getPrivateDataRepo } = createPeer({
    ...networkConfig,
    reducer: reduceToEtcPo,
    collection
  });
  const etcPoRepo = getPrivateDataRepo<EtcPo, EtcPoEvent>({
    entityName,
    reducer: reduceToEtcPo
  });
  const etcPoDataSource = new FabricData({ privatedataRepo: etcPoRepo });
  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    dataSources: () => ({ etcPoDataSource })
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
