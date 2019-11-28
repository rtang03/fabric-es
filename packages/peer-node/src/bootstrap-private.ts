// NodeJS event emitter is used to listen event arrival from on-chain write operation.
// This is default implementation of PubSub() of GraphQL Subscription
// For production-grade, other PubSub, e.g. Redis may replace event emmitter, in fabric-rx-cqrs
// Thereafter, below line is no longer required.
require('events').EventEmitter.defaultMaxListeners = 15;
import { buildFederatedSchema } from '@apollo/federation';
import { DataSrc } from '@espresso/common';
import { createPeer, getNetwork } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import './env';
import { DocContents, DocContentsEvents, docContentsReducer, LoanDetails, LoanDetailsEvents, loanDetailsReducer, resolvers, typeDefs } from './private';

const _bootstrap = async (networkConfig, port, enrollmentId) => {
  console.log(`♨️♨️  Bootstraping off-chain private data for '${process.env.ORGNAME}'...`);

  networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });
  const { getPrivateDataRepo } = createPeer({
    ...networkConfig,
    defaultEntityName: 'private',
    defaultReducer: loanDetailsReducer,
    collection: process.env.COLLECTION
  });
  const loanDetailsRepo = getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
    entityName: 'loanDetails',
    reducer: loanDetailsReducer
  });
  const docContentsRepo = getPrivateDataRepo<DocContents, DocContentsEvents>({
    entityName: 'docContents',
    reducer: docContentsReducer
  });

  const server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    playground: true,
    dataSources: () => ({
      loanDetails: new DataSrc({ repo: loanDetailsRepo }),
      docContents: new DataSrc({ repo: docContentsRepo })
    }),
    context: ({ req }) => {
      console.log(`${req.headers.client_id} is authenticated.`);
      return {
        enrollmentId: 'admin'
      };
    }
  });
  server.listen({ port }).then(({ url }) => {
    console.log(`🚀 '${process.env.ORGNAME}' - Private Data ready at ${url}`);
  });
};

export const bootstrap = async ({ port, enrollmentId }: {
  port: number;
  enrollmentId: string;
}) => {
  const networkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });

  _bootstrap(networkConfig, port, enrollmentId)
    .catch(error => {
      console.log(error);
      console.error(error.stack);
      networkConfig.gateway.disconnect();
      process.exit(0);
    });
};
bootstrap({ port: 14004, enrollmentId: 'admin'});