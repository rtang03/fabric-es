// import { buildFederatedSchema } from '@apollo/federation';
// import { createPeer, getNetwork, PeerOptions } from '@espresso/fabric-cqrs';
// import { ApolloServer } from 'apollo-server';
// import { config } from 'dotenv';
// import Listr from 'listr';
// import UpdaterRenderer from 'listr-update-renderer';
// import { resolve } from 'path';
//
// config({ path: resolve(__dirname, '../.env.org1') });
//
// import { resolvers, typeDefs } from './private';
// import { DocContents, DocContentsEvents, docContentsReducer } from './private/domain/doc-contents';
// import { LoanDetails, LoanDetailsEvents, loanDetailsReducer } from './private/domain/loan-details';
// import { DataSources, FabricData } from './types';
//
// let gateway;
// const port = 14002;
// const collection = process.env.COLLECTION || 'Org1PrivateDetails';
// const enrollmentId = process.env.ENROLLMENT_ID_ADMIN || 'admin';
//
// const tasks = new Listr(
//   [
//     {
//       title: 'Private Data Service: obtain network️',
//       task: ctx =>
//         getNetwork({
//           enrollmentId,
//           channelEventHubExisted: true
//         }).then(networkConfig => {
//           ctx.networkConfig = networkConfig;
//           gateway = networkConfig.gateway;
//         })
//     },
//     {
//       title: 'Subscribe Channel Event Hub',
//       task: ctx => {
//         const { getPrivateDataRepo } = createPeer({
//           ...(ctx.networkConfig as Partial<PeerOptions>),
//           defaultEntityName: 'loanDetails',
//           defaultReducer: loanDetailsReducer,
//           collection
//         });
//         ctx.loanDetailsRepo = getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
//           entityName: 'loanDetails',
//           reducer: loanDetailsReducer
//         });
//         ctx.docContentsRepo = getPrivateDataRepo<DocContents, DocContentsEvents>({
//           entityName: 'docContents',
//           reducer: docContentsReducer
//         });
//       }
//     },
//   ],
//   { renderer: UpdaterRenderer }
// );
//
// tasks
//   .run()
//   .then(ctx => {
//     const server = new ApolloServer({
//       schema: buildFederatedSchema([{ typeDefs, resolvers }]),
//       playground: true,
//       subscriptions: { path: '/graphql' },
//       dataSources: (): DataSources => ({
//         loanDetailsDataSource: new FabricData({ repo: ctx.loanDetailsRepo }),
//         docContentsDataSource: new FabricData({ repo: ctx.docContentsRepo })
//       }),
//       context: ({ req }) => {
//         console.log(`${req.headers.client_id} is authenticated.`);
//         return {
//           enrollmentId: 'admin'
//         };
//       }
//     });
//     server.listen({ port }).then(({ url }) => {
//       console.log(`💯 Server ready at ${url}`);
//     });
//   })
//   .catch(error => {
//     console.log(error);
//     console.error(error.stack);
//     gateway.disconnect();
//     process.exit(0);
//   });
