// const { resolve } = require('path');
// require('dotenv').config({
//   path: resolve(__dirname, './__utils__/.env.test')
// });
// import { createAuthServer, createDbConnection } from '@espresso/authentication';
// import {
//   User,
//   UserEvents,
//   userReducer,
//   userResolvers,
//   userTypeDefs
// } from '@espresso/model-common';
// import {
//   Document,
//   DocumentEvents,
//   documentReducer,
//   documentResolvers,
//   documentTypeDefs,
//   Loan,
//   LoanEvents,
//   loanReducer,
//   loanResolvers,
//   loanTypeDefs
// } from '@espresso/model-loan';
// import {
//   DocContents,
//   DocContentsEvents,
//   docContentsReducer,
//   LoanDetails,
//   LoanDetailsEvents,
//   loanDetailsReducer,
//   resolvers,
//   typeDefs
// } from '@espresso/model-loan-private';
// import { ApolloError, ApolloServer } from 'apollo-server';
// import { Express } from 'express';
// import { FileSystemWallet } from 'fabric-network';
// import http from 'http';
// import fetch from 'node-fetch';
// import request from 'supertest';
// import { createAdminService } from '../admin';
// import {
//   MISSING_VARIABLE,
//   UNAUTHORIZED_ACCESS,
//   USER_NOT_FOUND
// } from '../admin/constants';
// import {
//   CREATE_ROOT_CLIENT,
//   GET_BLOCK_BY_NUMBER,
//   GET_CA_IDENTITIES,
//   GET_CA_IDENTITY_BY_ENROLLMENT_ID,
//   GET_CHAIN_HEIGHT,
//   GET_CHANNEL_PEERS,
//   GET_COLLECTION_CONFIGS,
//   GET_INSTALLED_CC_VERSION,
//   GET_INSTALLED_CHAINCODES,
//   GET_INSTANTIATED_CHAINCODES,
//   GET_PEERINFO,
//   IS_WALLET_EXIST,
//   LIST_WALLET,
//   LOGIN,
//   REGISTER_ADMIN,
//   REGISTER_AND_ENROLL_USER
// } from '../admin/query';
// import { createGateway } from '../utils/createGateway'; // do not use shorten path
// import { createService } from '../utils/createService';

// // let accessToken: string;
// // let user_id: string;
// // const headers = { 'content-type': 'application/json' };

// const authPort = process.env.OAUTH_SERVER_PORT || 3300;
// const authUri = `http://localhost:${authPort}/graphql`;
// const username = `tester${Math.floor(Math.random() * 10000)}`;
// const email = `${username}@fake.it`;
// const password = 'password';
// const admin_password = 'admin_test';

// let gateway: Express;
// let authServer: http.Server;
// let uSrvUser: ApolloServer;
// let uSrvLoan: ApolloServer;
// let uSrvDocu: ApolloServer;
// let uSrvPriv: ApolloServer;
// let adminSrv: ApolloServer;

// beforeAll(async () => {
//   uSrvUser = await createService({
//     enrollmentId: 'admin', defaultEntityName: 'user', defaultReducer: userReducer, collection: process.env.COLLECTION
//   }).then(async ({ config, getRepository }) =>
//     config({ typeDefs: userTypeDefs, resolvers: userResolvers })
//       .addRepository(getRepository<User, UserEvents>({ entityName: 'user', reducer: userReducer }))
//       .create());
//   await uSrvUser.listen({ port: 14051 });

//   uSrvLoan = await createService({
//     enrollmentId: 'admin', defaultEntityName: 'loan', defaultReducer: loanReducer, collection: process.env.COLLECTION
//   }).then(async ({ config, getRepository }) =>
//     config({ typeDefs: loanTypeDefs, resolvers: loanResolvers })
//       .addRepository(getRepository<Loan, LoanEvents>({ entityName: 'loan', reducer: loanReducer }))
//       .create());
//   await uSrvLoan.listen({ port: 14052 });

//   uSrvDocu = await createService({
//     enrollmentId: 'admin', defaultEntityName: 'document', defaultReducer: documentReducer, collection: process.env.COLLECTION
//   }).then(async ({ config, getRepository }) =>
//     config({ typeDefs: documentTypeDefs, resolvers: documentResolvers })
//       .addRepository(getRepository<Document, DocumentEvents>({ entityName: 'document', reducer: documentReducer }))
//       .create());
//   await uSrvDocu.listen({ port: 14053 });

//   uSrvPriv = await createService({
//     enrollmentId: 'admin', defaultEntityName: 'private', defaultReducer: docContentsReducer, collection: process.env.COLLECTION, isPrivate: true
//   }).then(async ({ config, getPrivateDataRepo }) =>
//     config({ typeDefs, resolvers })
//       .addRepository(getPrivateDataRepo<DocContents, DocContentsEvents>({ entityName: 'docContents', reducer: docContentsReducer }))
//       .addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({ entityName: 'loanDetails', reducer: loanDetailsReducer }))
//       .create());
//   await uSrvPriv.listen({ port: 14054 });

//   // step 1: start admin service (federated service)
//   adminSrv = await createAdminService({
//     channelName: process.env.CHANNEL_NAME,
//     peerName: process.env.PEER_NAME,
//     connectionProfile: process.env.CONNECTION_PROFILE,
//     fabricNetwork: process.env.NETWORK_LOCATION,
//     walletPath: process.env.WALLET
//   });
//   await adminSrv.listen({ port: 15051 });

//   // step 2: prepare federated gateway
//   gateway = await createGateway({
//     serviceList: [
//       { name: 'user',     url: 'http://localhost:14051/graphql' },
//       { name: 'loan',     url: 'http://localhost:14052/graphql' },
//       { name: 'document', url: 'http://localhost:14053/graphql' },
//       { name: 'private',  url: 'http://localhost:14054/graphql' },
// //    { name: 'remote-loan-details', url: 'http://localhost:14015/graphql' },
//       { name: 'admin',    url: 'http://localhost:15051/graphql' }
//     ]});

//   // step 3: start authentication server (expressjs)
//   const auth = await createAuthServer({
//     rootAdmin: process.env.ADMIN,
//     rootAdminPassword: process.env.ADMIN_PASSWORD,
//     dbConnection: createDbConnection({
//       name: 'default',
//       type: 'postgres' as any,
//       host: 'localhost',
//       port: 5432,
//       username: 'postgres',
//       password: 'docker',
//       database: 'gw-org1',
//       logging: false,
//       synchronize: true,
//       dropSchema: true
//     })
//   });
//   authServer = http.createServer(auth);
//   authServer.listen(authPort);
// });

// afterAll(async () => {
//   authServer.close();
//   await adminSrv.stop();
//   await uSrvPriv.stop();
//   await uSrvDocu.stop();
//   await uSrvLoan.stop();
//   await uSrvUser.stop();
//   return new Promise(done => setTimeout(() => done(), 500));
// });

// // require a running Fabric network
// // run service.integration.test in fabric-cqrs, if no pre-existing onchain data
// describe('Integration Tests', () => {
//   it('dummy test', async () =>
//     expect(true).toBeTruthy()
//   );
// });
