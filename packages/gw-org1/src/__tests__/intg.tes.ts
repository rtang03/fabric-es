// require('../env');
// import http from 'http';
// import { getReducer } from '@fabric-es/fabric-cqrs';
// import { createAdminService, createGateway, createService } from '@fabric-es/gateway-lib';
// import {
//   CREATE_DOC_CONTENTS,
//   CREATE_DOCUMENT,
//   DELETE_DOCUMENT,
//   DocContents,
//   DocContentsEvents,
//   docContentsReducer,
//   docContentsResolvers,
//   docContentsTypeDefs,
//   Document,
//   DocumentEvents,
//   documentReducer,
//   documentResolvers,
//   documentTypeDefs,
//   RESTRICT_DOCUMENT_ACCESS,
//   UPDATE_DOC_CONTENTS,
//   UPDATE_DOCUMENT,
// } from '@fabric-es/model-document';
// import {
//   APPLY_LOAN,
//   APPROVE_LOAN,
//   CANCEL_LOAN,
//   CREATE_LOAN_DETAILS,
//   EXPIRE_LOAN,
//   Loan,
//   LoanDetails,
//   LoanDetailsEvents,
//   loanDetailsReducer,
//   loanDetailsResolvers,
//   loanDetailsTypeDefs,
//   LoanEvents,
//   loanReducer,
//   loanResolvers,
//   loanTypeDefs,
//   REJECT_LOAN,
//   RETURN_LOAN,
//   UPDATE_LOAN,
//   UPDATE_LOAN_DETAILS,
// } from '@fabric-es/model-loan';
// import { enrollAdmin } from '@fabric-es/operator';
// import { ApolloServer } from 'apollo-server';
// import { Wallets } from 'fabric-network';
// import { RedisOptions } from 'ioredis';
// import fetch from 'node-fetch';
// import request from 'supertest';
// import {
//   GET_COMMITS_BY_DOCUMENT,
//   GET_COMMITS_BY_LOAN,
//   GET_DOCUMENT_BY_ID,
//   GET_LOAN_BY_ID,
//   GW_REGISTER_ENROLL,
//   OAUTH_LOGIN,
//   OAUTH_REGISTER,
// } from './queries';
//
// const oPort = 3001;
// const gPort = 4001;
// const aPort = 15050;
// const lPort = 14052;
// const dPort = 14053;
// const tPort = 14054;
// const cPort = 14055;
// const lReducer = getReducer<Loan, LoanEvents>(loanReducer);
// const dReducer = getReducer<Document, DocumentEvents>(documentReducer);
// const tReducer = getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer);
// const cReducer = getReducer<DocContents, DocContentsEvents>(docContentsReducer);
//
// const AUTH_SERVER = `http://localhost:${oPort}/graphql`;
// const GATE_SERVICE = `http://localhost:${gPort}/graphql`;
// const userId = 'unitTestUser';
// const timestamp = Date.now();
// const amail = `a${timestamp}@${process.env.ORGNAME}`;
// const email = `u${timestamp}@${process.env.ORGNAME}`;
// const password = 'p@ssw0rd';
// const adminame = `a${timestamp}`;
// const username = `u${timestamp}`;
// const loanId0 = `la${timestamp}`;
// const loanId1 = `lb${timestamp + 10}`;
// const loanId2 = `lc${timestamp + 20}`;
// const loanId3 = `ld${timestamp + 30}`;
// const loanId4 = `le${timestamp + 40}`;
// const loanId5 = `lf${timestamp + 50}`;
// const documentId0 = `da${timestamp}`;
// const documentId1 = `db${timestamp + 10}`;
// const documentId2 = `dc${timestamp + 20}`;
// const documentId3 = `dd${timestamp + 30}`;
// const documentId4 = `de${timestamp + 40}`;
// const documentId5 = `df${timestamp + 50}`;
// const documentId6 = `dg${timestamp + 60}`;
// const documentId7 = `dh${timestamp + 70}`;
//
// let adminService: ApolloServer;
// let loanService: ApolloServer;
// let loanDisconnect: any;
// let docuService: ApolloServer;
// let docuDisconnect: any;
// let dtlsService: ApolloServer;
// let dtlsDisconnect: any;
// let ctntService: ApolloServer;
// let ctntDisconnect: any;
// let gateway: http.Server;
//
// let isAuthenticated = false;
// let isReady = false;
// let accessToken;
//
// beforeAll(async () => {
//   console.log(`♨️♨️  Enroll administrator ${process.env.ORG_ADMIN_ID}`);
//   if (
//     !(await enrollAdmin({
//       enrollmentID: process.env.ORG_ADMIN_ID,
//       enrollmentSecret: process.env.ORG_ADMIN_SECRET,
//       mspId: process.env.MSPID,
//       caName: process.env.CA_NAME,
//       connectionProfile: process.env.CONNECTION_PROFILE,
//       wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
//     })
//       .then((result) => result.status === 'SUCCESS')
//       .catch((_) => false))
//   ) {
//     console.log(`♨️♨️  Enroll administrator ${process.env.ORG_ADMIN_ID} failed`);
//     return;
//   }
//
//   console.log(`♨️♨️  Enroll CA administrator ${process.env.CA_ENROLLMENT_ID_ADMIN}`);
//   if (
//     !(await enrollAdmin({
//       enrollmentID: process.env.CA_ENROLLMENT_ID_ADMIN,
//       enrollmentSecret: process.env.CA_ENROLLMENT_SECRET_ADMIN,
//       mspId: process.env.MSPID,
//       caName: process.env.CA_NAME,
//       connectionProfile: process.env.CONNECTION_PROFILE,
//       wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
//     })
//       .then((result) => result.status === 'SUCCESS')
//       .catch((_) => false))
//   ) {
//     console.log(`♨️♨️  Enroll CA administrator ${process.env.CA_ENROLLMENT_ID_ADMIN} failed`);
//     return;
//   }
//
//   console.log(`♨️♨️  Registering admin to ${AUTH_SERVER} as ${amail} / ${adminame} / ${password}`);
//   if (
//     !(await fetch(AUTH_SERVER, {
//       method: 'POST',
//       headers: { 'content-type': 'application/json' },
//       body: JSON.stringify({
//         operationName: 'Register',
//         query: OAUTH_REGISTER,
//         variables: {
//           email: amail,
//           username: adminame,
//           password,
//           admin_password: 'root_admin1_password',
//         },
//       }),
//     })
//       .then((res) => res.json())
//       .then(
//         ({ data, errors }) =>
//           data || errors.map((d) => (d && d.message ? d.message : '')) === 'already exist'
//       ))
//   ) {
//     console.log(`♨️♨️  Registering admin to OAUTH server ${AUTH_SERVER} failed`);
//     return;
//   }
//
//   console.log(`♨️♨️  Admin logging in to ${AUTH_SERVER} as ${amail} / ${password}`);
//   const { adminLoggedIn, adminId, adminToken } = await fetch(AUTH_SERVER, {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({
//       operationName: 'Login',
//       query: OAUTH_LOGIN,
//       variables: { email: amail, password },
//     }),
//   })
//     .then((res) => res.json())
//     .then(({ data }) => {
//       if (data.login.ok) {
//         return {
//           adminLoggedIn: true,
//           adminId: data.login.user.id,
//           adminToken: data.login.accessToken,
//         };
//       }
//     });
//   if (!adminLoggedIn) {
//     console.log(
//       `♨️♨️  Admin logging in to OAUTH server ${AUTH_SERVER} as ${amail} / ${password} failed`
//     );
//     return;
//   }
//
//   console.log(`♨️♨️  Registering to ${AUTH_SERVER} as ${email} / ${username} / ${password}`);
//   if (
//     !(await fetch(AUTH_SERVER, {
//       method: 'POST',
//       headers: { 'content-type': 'application/json' },
//       body: JSON.stringify({
//         operationName: 'Register',
//         query: OAUTH_REGISTER,
//         variables: { email, username, password },
//       }),
//     })
//       .then((res) => res.json())
//       .then(
//         ({ data, errors }) =>
//           data || errors.map((d) => (d && d.message ? d.message : '')) === 'already exist'
//       ))
//   ) {
//     console.log(`♨️♨️  Registering to OAUTH server ${AUTH_SERVER} failed`);
//     return;
//   }
//
//   console.log(`♨️♨️  Logging in to ${AUTH_SERVER} as ${email} / ${password}`);
//   const { loggedIn, enrollmentId, token } = await fetch(AUTH_SERVER, {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({
//       operationName: 'Login',
//       query: OAUTH_LOGIN,
//       variables: { email, password },
//     }),
//   })
//     .then((res) => res.json())
//     .then(({ data }) => {
//       if (data.login.ok) {
//         return {
//           loggedIn: true,
//           enrollmentId: data.login.user.id,
//           token: data.login.accessToken,
//         };
//       }
//     });
//   if (!loggedIn) {
//     console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER} as ${email} / ${password} failed`);
//     return;
//   }
//
//   console.log(`♨️♨️  Enrolling user ${enrollmentId} to network via ${aPort}`);
//   isAuthenticated = true;
//   accessToken = token;
//
//   const redisOptions: RedisOptions = {
//     host: process.env.REDIS_HOST,
//     port: (process.env.REDIS_PORT || 6379) as number,
//     retryStrategy: (times) => {
//       if (times > 3) {
//         // the 4th return will exceed 10 seconds, based on the return value...
//         console.log(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
//         process.exit(-1);
//       }
//       return Math.min(times * 100, 3000); // reconnect after (ms)
//     },
//     reconnectOnError: (err) => {
//       const targetError = 'READONLY';
//       if (err.message.includes(targetError)) {
//         // Only reconnect when the error contains "READONLY"
//         return 1;
//       }
//     },
//   };
//
//   // Start admin service
//   ({ server: adminService } = await createAdminService({
//     caAdmin: process.env.CA_ENROLLMENT_ID_ADMIN,
//     caAdminPW: process.env.CA_ENROLLMENT_SECRET_ADMIN,
//     channelName: process.env.CHANNEL_NAME,
//     connectionProfile: process.env.CONNECTION_PROFILE,
//     caName: process.env.CA_NAME,
//     walletPath: process.env.WALLET,
//     orgName: process.env.ORGNAME,
//     orgUrl: process.env.ORGURL,
//     redisOptions,
//   }));
//
//   await adminService.listen({ port: aPort });
//
//   console.log('🚀  Ready, starting services');
//   // Start loan service
//   const loanService = await createService({
//     enrollmentId: process.env.ORG_ADMIN_ID,
//     serviceName: 'loan',
//     channelName: process.env.CHANNEL_NAME,
//     connectionProfile: process.env.CONNECTION_PROFILE,
//     wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
//     asLocalhost: !(process.env.NODE_ENV === 'production'),
//     redisOptions,
//   }).then(({ config, disconnect }) => {
//     loanDisconnect = disconnect;
//     return config({ typeDefs: loanTypeDefs, resolvers: loanResolvers })
//       .addRepository<Loan, LoanEvents>('loan', lReducer)
//       .create();
//   });
//
//   await loanService
//     .listen({ port: lPort })
//     .then(({ url }) =>
//       console.log(`🚀  ${process.env.ORGNAME} unit test`, 'loan available at', url)
//     );
//
//   // Start document service
//   const docuService = await createService({
//     enrollmentId: process.env.ORG_ADMIN_ID,
//     serviceName: 'document',
//     channelName: process.env.CHANNEL_NAME,
//     connectionProfile: process.env.CONNECTION_PROFILE,
//     wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
//     asLocalhost: !(process.env.NODE_ENV === 'production'),
//     redisOptions,
//   }).then(({ config, disconnect }) => {
//     docuDisconnect = disconnect;
//     return config({ typeDefs: documentTypeDefs, resolvers: documentResolvers })
//       .addRepository<Document, DocumentEvents>('document', dReducer)
//       .create();
//   });
//
//   await docuService
//     .listen({ port: dPort })
//     .then(({ url }) =>
//       console.log(`🚀  ${process.env.ORGNAME} unit test`, 'document available at', url)
//     );
//
//   // Start loan-details service
//   const dtlsService = await createService({
//     enrollmentId: process.env.ORG_ADMIN_ID,
//     serviceName: 'loanDetails',
//     isPrivate: true,
//     channelName: process.env.CHANNEL_NAME,
//     connectionProfile: process.env.CONNECTION_PROFILE,
//     wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
//     asLocalhost: !(process.env.NODE_ENV === 'production'),
//     redisOptions,
//   }).then(({ config, getPrivateRepository, disconnect }) => {
//     dtlsDisconnect = disconnect;
//     return config({ typeDefs: loanDetailsTypeDefs, resolvers: loanDetailsResolvers })
//       .addPrivateRepository<LoanDetails, LoanDetailsEvents>('loanDetails', tReducer)
//       .create();
//   });
//
//   await dtlsService
//     .listen({ port: tPort })
//     .then(({ url }) =>
//       console.log(`🚀  ${process.env.ORGNAME} unit test`, 'loan-details available at', url)
//     );
//
//   // Start doc-contents service
//   const ctntService = await createService({
//     enrollmentId: process.env.ORG_ADMIN_ID,
//     serviceName: 'docContents',
//     isPrivate: true,
//     channelName: process.env.CHANNEL_NAME,
//     connectionProfile: process.env.CONNECTION_PROFILE,
//     wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
//     asLocalhost: !(process.env.NODE_ENV === 'production'),
//     redisOptions,
//   }).then(({ config, disconnect }) => {
//     ctntDisconnect = disconnect;
//     return config({ typeDefs: docContentsTypeDefs, resolvers: docContentsResolvers })
//       .addPrivateRepository<DocContents, DocContentsEvents>('docContents', cReducer)
//       .create();
//   });
//
//   await ctntService
//     .listen({ port: cPort })
//     .then(({ url }) =>
//       console.log(`🚀  ${process.env.ORGNAME} unit test`, 'doc-contents available at', url)
//     );
//
//   // Start federated gateway
//   gateway = await createGateway({
//     serviceList: [
//       { name: 'admin', url: `http://localhost:${aPort}/graphql` },
//       { name: 'loan', url: `http://localhost:${lPort}/graphql` },
//       { name: 'document', url: `http://localhost:${dPort}/graphql` },
//       { name: 'loanDetails', url: `http://localhost:${tPort}/graphql` },
//       { name: 'docContents', url: `http://localhost:${cPort}/graphql` },
//     ],
//     authenticationCheck: process.env.AUTHORIZATION_SERVER_URI,
//     useCors: true,
//     debug: false,
//   });
//
//   isReady = await request(gateway)
//     .post('/graphql')
//     .set('authorization', `bearer ${accessToken}`)
//     .send({
//       operationName: 'RegisterAndEnrollUser',
//       query: GW_REGISTER_ENROLL,
//       variables: {
//         enrollmentId,
//         enrollmentSecret: 'password',
//         administrator: process.env.CA_ENROLLMENT_ID_ADMIN,
//       },
//     })
//     .then(({ body: { data } }) => data);
//   if (!isReady) {
//     console.log(`♨️♨️  Enrolling user ${enrollmentId} to network via ${aPort} failed`);
//     return;
//   }
// });
//
// afterAll(async () => {
//   if (isAuthenticated) await adminService.stop();
//
//   if (isReady) {
//     ctntDisconnect();
//     dtlsDisconnect();
//     docuDisconnect();
//     loanDisconnect();
//     await ctntService.stop();
//     await dtlsService.stop();
//     await docuService.stop();
//     await loanService.stop();
//   }
//
//   return new Promise<void>((ok) =>
//     setTimeout(() => {
//       console.log('🚀  Test finished');
//       ok();
//     }, 500)
//   );
// });
//
// describe('Unit Test: Org1 Apply Loans', () => {
//   it('apply loan 0', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId0,
//             description: 'Unit test org1 loan 0',
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-0',
//             comment: 'Hello 0000',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.applyLoan.id).toEqual(loanId0))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('apply loan 1', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId1,
//             description: 'Unit test org1 loan 1',
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-1',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.applyLoan.id).toEqual(loanId1))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('apply loan 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId2,
//             description: 'Unit test org1 loan 2',
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-2',
//             comment: 'Hello 0002',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.applyLoan.id).toEqual(loanId2))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('apply loan 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId3,
//             description: 'Unit test org1 loan 3',
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-3',
//             comment: 'Hello 0003',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.applyLoan.id).toEqual(loanId3))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('apply loan 4', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId4,
//             description: 'Unit test org1 loan 4',
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-4',
//             comment: 'Hello 0004',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.applyLoan.id).toEqual(loanId4))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('apply loan 5', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId5,
//             description: 'Unit test org1 loan 5',
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-5',
//             comment: 'Hello 0005',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.applyLoan.id).toEqual(loanId5))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('apply loan without description', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: 'L9999',
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-9999',
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('was not provided') ? cur.message : acc),
//               ''
//             )
//           ).toContain('was not provided')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//   });
//
//   it('apply loan with empty description', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: 'L9999',
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-9999',
//             description: '',
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc),
//               ''
//             )
//           ).toContain('REQUIRED_DATA_MISSING')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//   });
//
//   // TODO: Implement lifecycle event attribute to prevent creating same entity more than once
//   // NOTE: This 'apply loan' call should return normal, but querying 'L0000' should return the original result instead of the changed values
//   it('apply loan 0 again', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApplyLoan',
//           query: APPLY_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId0,
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-0VERWRITTEN',
//             description: 'Unit test org1 loan 0VERWRITTEN',
//             comment: 'Hello 000VERWRITTEN',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.applyLoan.id).toEqual(loanId0))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
//
// describe('Unit Test: Org1 Create LoanDetails', () => {
//   it('add loan details 0', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateLoanDetails',
//           query: CREATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId0,
//             requester: {
//               registration: 'BR1234567XXX0',
//               name: 'Loan Requester 0',
//             },
//             contact: {
//               name: 'Contact 0',
//               phone: '555-0000',
//               email: 'c0000@fake.it',
//             },
//             startDate: '1574846420900',
//             tenor: 50,
//             currency: 'HKD',
//             requestedAmt: 40.9,
//             comment: 'Unit test org1 loanDetails 0',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createLoanDetails.id).toEqual(loanId0))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('add loan details 1', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateLoanDetails',
//           query: CREATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId1,
//             requester: { registration: 'BR1234567XXX1', name: 'Loan Requester 1' },
//             contact: { name: 'Contact 1', phone: '555-0001', email: 'c0001@fake.it' },
//             startDate: '1574846420901',
//             tenor: 51,
//             currency: 'HKD',
//             requestedAmt: 41.9,
//             comment: 'Unit test org1 loanDetails 1',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createLoanDetails.id).toEqual(loanId1))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('add loan details 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateLoanDetails',
//           query: CREATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId2,
//             requester: { registration: 'BR1234567XXX2', name: 'Loan Requester 2' },
//             contact: { name: 'Contact 2', phone: '555-0002', email: 'c0002@fake.it' },
//             startDate: '1574846420902',
//             tenor: 52,
//             currency: 'HKD',
//             requestedAmt: 42.9,
//             comment: 'Unit test org1 loanDetails 2',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createLoanDetails.id).toEqual(loanId2))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('add loan details 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateLoanDetails',
//           query: CREATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId3,
//             requester: { registration: 'BR1234567XXX3', name: 'Loan Requester 3' },
//             contact: { name: 'Contact 3', phone: '555-0003', email: 'c0003@fake.it' },
//             startDate: '1574846420903',
//             tenor: 53,
//             currency: 'HKD',
//             requestedAmt: 43.9,
//             comment: 'Unit test org1 loanDetails 3',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createLoanDetails.id).toEqual(loanId3))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('add loan details 4', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateLoanDetails',
//           query: CREATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId4,
//             requester: { registration: 'BR1234567XXX4', name: 'Loan Requester 4' },
//             contact: { name: 'Contact 4', phone: '555-0004', email: 'c0004@fake.it' },
//             startDate: '1574846420904',
//             tenor: 54,
//             currency: 'HKD',
//             requestedAmt: 44.9,
//             comment: 'Unit test org1 loanDetails 4',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createLoanDetails.id).toEqual(loanId4))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('add loan details 5', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateLoanDetails',
//           query: CREATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId5,
//             requester: { registration: 'BR1234567XXX5', name: 'Loan Requester 5' },
//             contact: { name: 'Contact 5', phone: '555-0005', email: 'c0005@fake.it' },
//             startDate: '1574846420905',
//             tenor: 55,
//             currency: 'HKD',
//             requestedAmt: 45.9,
//             comment: 'Unit test org1 loanDetails 5',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createLoanDetails.id).toEqual(loanId5))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   // TODO: Implement lifecycle event attribute to prevent creating same entity more than once
//   // NOTE: This 'create loanDetails' call should return normal, but querying 'L0000' should return the original result instead of the changed values
//   it('create loan details 0 again', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateLoanDetails',
//           query: CREATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId0,
//             requester: {
//               registration: 'BR1234567XXX0VERWRITTEN',
//               name: 'Loan Requester 0VERWRITTEN',
//             },
//             contact: { name: 'Contact 0VERWRITTEN', phone: '555-0000', email: 'c0000@fake.it' },
//             startDate: '1574846420900',
//             tenor: 50,
//             currency: 'HKD',
//             requestedAmt: 40.9,
//             comment: 'Unit test org1 loanDetails 0VERWRITTEN',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createLoanDetails.id).toEqual(loanId0))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('add loan details with empty contact phone', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateLoanDetails',
//           query: CREATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: 'L9999',
//             requester: { registration: 'BR1234567XXX5', name: 'Loan Requester 9' },
//             contact: { name: 'Contact 9', phone: '', email: 'c0009@fake.it' },
//             startDate: '1574846420909',
//             tenor: 59,
//             currency: 'HKD',
//             requestedAmt: 49.9,
//             comment: 'Unit test org1 loanDetails 9',
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc),
//               ''
//             )
//           ).toContain('REQUIRED_DATA_MISSING')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
//
// describe('Unit Test: Org1 Create Documents', () => {
//   it('create document 0', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId0,
//             loanId: loanId0,
//             title: 'Unit test org1 document 0',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-0',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId0))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create document 1', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId1,
//             loanId: loanId0,
//             title: 'Unit test org1 document 1',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-1',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId1))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create document 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId2,
//             title: 'Unit test org1 document 2',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-2',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId2))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create document 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId3,
//             loanId: loanId0,
//             title: 'Unit test org1 document 3',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-3',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId3))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create document 4', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId4,
//             loanId: loanId2,
//             title: 'Unit test org1 document 4',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-4',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId4))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create document 5', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId5,
//             loanId: loanId3,
//             title: 'Unit test org1 document 5',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-5',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId5))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create document 6', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId6,
//             loanId: loanId4,
//             title: 'Unit test org1 document 6',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-6',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId6))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create document 7', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId7,
//             loanId: loanId5,
//             title: 'Unit test org1 document 7',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-7',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId7))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   // TODO: Implement lifecycle event attribute to prevent creating same entity more than once
//   // NOTE: This 'create document' call should return normal, but querying 'D0000' should return the original result instead of the changed values
//   it('create document 0 again', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocument',
//           query: CREATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId0,
//             loanId: loanId0,
//             title: 'Unit test org1 document 0VERWRITTEN',
//             reference: 'REF-UNIT-TEST-ORG1-DOC-0VERWRITTEN',
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocument.id).toEqual(documentId0))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
//
// describe('Unit Test: Org1 Create DocContents', () => {
//   it('create docContents 0', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId0,
//             content: { body: `{ "message": "Unit test org1 docContents 0" }` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId0))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create docContents 1', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId1,
//             content: { format: 'PDF', link: `http://fake.it/docs/org1UnitTestDocContents-1.pdf` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId1))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create docContents 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId2,
//             content: { format: 'PDF', link: `http://fake.it/docs/org1UnitTestDocContents-2.pdf` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId2))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create docContents 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId3,
//             content: { body: `{ "message": "Unit test org1 docContents 3" }` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId3))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create docContents 4', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId4,
//             content: { body: `{ "message": "Unit test org1 docContents 4" }` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId4))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create docContents 5', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId5,
//             content: { format: 'PDF', link: `http://fake.it/docs/org1UnitTestDocContents-5.pdf` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId5))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create docContents 6', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId6,
//             content: { body: `{ "message": "Unit test org1 docContents 6" }` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId6))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create docContents 7', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId7,
//             content: { format: 'PDF', link: `http://fake.it/docs/org1UnitTestDocContents-7.pdf` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId7))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   // TODO: Implement lifecycle event attribute to prevent creating same entity more than once
//   // NOTE: This 'create docContents' call should return normal, but querying 'D0000' should return the original result instead of the changed values
//   it('create docContents 0 again', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId0,
//             content: { body: `{ "message": "Unit test org1 docContents 0VERWRITTEN" }` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.createDocContents.id).toEqual(documentId0))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('create docContents with empty content', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CreateDocContents',
//           query: CREATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: 'D9999',
//             content: {},
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc),
//               ''
//             )
//           ).toContain('REQUIRED_DATA_MISSING')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
//
// describe('Unit Test: Org1 Loans operations', () => {
//   it('update loan 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoan',
//           query: UPDATE_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId2,
//             description: 'Unit test org1 loan 2 EDITED',
//           },
//         })
//         .expect(({ body: { data } }) =>
//           expect(data.updateLoan.map((d) => (d && d.id ? d.id : ''))).toContain(loanId2)
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('add comment to existing loan 1', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoan',
//           query: UPDATE_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId1,
//             comment: 'Hello 0001 ADDED',
//           },
//         })
//         .expect(({ body: { data } }) =>
//           expect(data.updateLoan.map((d) => (d && d.id ? d.id : ''))).toContain(loanId1)
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update loan 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoan',
//           query: UPDATE_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId3,
//             description: 'Unit test org1 loan 3 EDITED',
//             comment: 'Hello 0003 EDITED',
//           },
//         })
//         .expect(({ body: { data } }) =>
//           expect(data.updateLoan.map((d) => (d && d.id ? d.id : ''))).toContain(loanId3)
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update readonly field of loan 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoan',
//           query: UPDATE_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId2,
//             reference: 'REF-UNIT-TEST-ORG1-LOAN-2-EDITED',
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('INVALID_OPERATION') ? cur.message : acc),
//               ''
//             )
//           ).toContain('INVALID_OPERATION')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update an non-existing loan', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoan',
//           query: UPDATE_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: 'L9999',
//             description: 'Unit test org1 loan 9 EDITED',
//             comment: 'Hello 9999 EDITED',
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('LOAN_NOT_FOUND') ? cur.message : acc),
//               ''
//             )
//           ).toContain('LOAN_NOT_FOUND')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update loan 4 with empty description', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoan',
//           query: UPDATE_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId4,
//             description: '',
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc),
//               ''
//             )
//           ).toContain('REQUIRED_DATA_MISSING')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update loan 5 with both successful and fail cases', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoan',
//           query: UPDATE_LOAN.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId5,
//             reference: 'HITHERE',
//             description: '',
//             comment: 'Hello 0005 EDITED',
//           },
//         })
//         .expect(({ body: { data, errors } }) => {
//           const errs = errors.map((e) => e.message);
//           expect(errs).toContain('Error: INVALID_OPERATION');
//           expect(errs).toContain('Error: REQUIRED_DATA_MISSING');
//           expect(data.updateLoan.map((d) => (d && d.id ? d.id : ''))).toContain(loanId5);
//         })
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('cancel loan 1', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'CancelLoan',
//           query: CANCEL_LOAN.loc.source.body,
//           variables: { userId, loanId: loanId1 },
//         })
//         .expect(({ body: { data } }) => expect(data.cancelLoan.id).toEqual(loanId1))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('approve loan 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ApproveLoan',
//           query: APPROVE_LOAN.loc.source.body,
//           variables: { userId, loanId: loanId2 },
//         })
//         .expect(({ body: { data } }) => expect(data.approveLoan.id).toEqual(loanId2))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('return loan 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ReturnLoan',
//           query: RETURN_LOAN.loc.source.body,
//           variables: { userId, loanId: loanId3 },
//         })
//         .expect(({ body: { data } }) => expect(data.returnLoan.id).toEqual(loanId3))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('reject loan 4', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'RejectLoan',
//           query: REJECT_LOAN.loc.source.body,
//           variables: { userId, loanId: loanId4 },
//         })
//         .expect(({ body: { data } }) => expect(data.rejectLoan.id).toEqual(loanId4))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('flag loan 5 as expired', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'ExpireLoan',
//           query: EXPIRE_LOAN.loc.source.body,
//           variables: { userId, loanId: loanId5 },
//         })
//         .expect(({ body: { data } }) => expect(data.expireLoan.id).toEqual(loanId5))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
//
// describe('Unit Test: Org1 Documents operations', () => {
//   it('update document 1', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocument',
//           query: UPDATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId1,
//             title: 'Unit test org1 document 1 EDITED',
//           },
//         })
//         .expect(({ body: { data } }) =>
//           expect(data.updateDocument.map((d) => (d && d.id ? d.id : ''))).toContain(documentId1)
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('associate document 2 to loan 0', async () => {
//     // , loanId: loanId0
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocument',
//           query: UPDATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId2,
//             loanId: loanId0,
//           },
//         })
//         .expect(({ body: { data } }) =>
//           expect(data.updateDocument.map((d) => (d && d.id ? d.id : ''))).toContain(documentId2)
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update document 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocument',
//           query: UPDATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId3,
//             loanId: loanId1,
//             title: 'Unit test org1 document 1 EDITED',
//           },
//         })
//         .expect(({ body: { data } }) =>
//           expect(data.updateDocument.map((d) => (d && d.id ? d.id : ''))).toContain(documentId3)
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update readonly field of document 4', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocument',
//           query: UPDATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId4,
//             reference: 'REF-UNIT-TEST-ORG1-DOC-1-EDITED',
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('INVALID_OPERATION') ? cur.message : acc),
//               ''
//             )
//           ).toContain('INVALID_OPERATION')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update document 5', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocument',
//           query: UPDATE_DOCUMENT.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId5,
//             reference: 'REF-UNIT-TEST-ORG1-DOC-1-EDITED',
//             title: 'Unit test org1 document 5 EDITED',
//           },
//         })
//         .expect(({ body: { data, errors } }) => {
//           expect(errors.map((e) => e.message)).toContain('Error: INVALID_OPERATION');
//           expect(data.updateDocument.map((d) => (d && d.id ? d.id : ''))).toContain(documentId5);
//         })
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update document status', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'RestrictAccess',
//           query: RESTRICT_DOCUMENT_ACCESS.loc.source.body,
//           variables: { userId, documentId: documentId6 },
//         })
//         .expect(({ body: { data } }) => expect(data.restrictAccess.id).toEqual(documentId6))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('delete document', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'DeleteDocument',
//           query: DELETE_DOCUMENT.loc.source.body,
//           variables: { userId, documentId: documentId2 },
//         })
//         .expect(({ body: { data } }) => expect(data.deleteDocument.id).toEqual(documentId2))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
//
// describe('Unit Test: Org1 LoanDetails operations', () => {
//   it('update loanDetails 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoanDetails',
//           query: UPDATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId2,
//             contact: {
//               name: 'Contact 2 EDITED',
//               phone: '555-99992',
//             },
//             currency: 'USD',
//             comment: 'Unit test org1 loanDetails 2 EDITED',
//           },
//         })
//         .expect(({ body: { data } }) =>
//           expect(data.updateLoanDetails.map((d) => (d && d.id ? d.id : ''))).toContain(loanId2)
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update loanDetails 1 with both successful and fail cases', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoanDetails',
//           query: UPDATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId1,
//             requester: { name: 'Loan Requester 999' },
//             contact: { phone: '555-99991' },
//             currency: '',
//             comment: 'Unit test org1 loanDetails 1 EDITED',
//           },
//         })
//         .expect(({ body: { data, errors } }) => {
//           const errs = errors.map((e) => e.message);
//           expect(errs).toContain('Error: INVALID_OPERATION');
//           expect(errs).toContain('Error: REQUIRED_DATA_MISSING');
//           expect(data.updateLoanDetails.map((d) => (d && d.id ? d.id : ''))).toContain(loanId1);
//         })
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update an non-existing loanDetails', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoanDetails',
//           query: UPDATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: 'L9999',
//             requester: { name: 'Loan Requester 999' },
//             contact: { phone: '555-99991' },
//             currency: '',
//             comment: 'Unit test org1 loanDetails 9 EDITED',
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('LOAN_DETAILS_NOT_FOUND') ? cur.message : acc),
//               ''
//             )
//           ).toContain('LOAN_DETAILS_NOT_FOUND')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('remove a mandatory field from loanDetails 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateLoanDetails',
//           query: UPDATE_LOAN_DETAILS.loc.source.body,
//           variables: {
//             userId,
//             loanId: loanId3,
//             contact: { phone: '' },
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc),
//               ''
//             )
//           ).toContain('REQUIRED_DATA_MISSING')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
//
// describe('Unit Test: Org1 DocContents operations', () => {
//   it('update docContents 1', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocContents',
//           query: UPDATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId1,
//             content: { format: 'JPEG', link: `http://fake.it/docs/org1UnitTestDocContents-1.jpg` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.updateDocContents.id).toEqual(documentId1))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update docContents 3', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocContents',
//           query: UPDATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId3,
//             content: { body: `{ "message": "Unit test org1 docContents 3 EDITED" }` },
//           },
//         })
//         .expect(({ body: { data } }) => expect(data.updateDocContents.id).toEqual(documentId3))
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('change content type of docContents 2', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocContents',
//           query: UPDATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId2,
//             content: { body: `{ "message": "Unit test org1 docContents 2 CHANGED" }` },
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('DOC_CONTENTS_MISMATCHED') ? cur.message : acc),
//               ''
//             )
//           ).toContain('DOC_CONTENTS_MISMATCHED')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('change content type of docContents 4', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocContents',
//           query: UPDATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId4,
//             content: { format: 'JPEG', link: `http://fake.it/docs/org1UnitTestDocContents-4.jpg` },
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('DOC_CONTENTS_MISMATCHED') ? cur.message : acc),
//               ''
//             )
//           ).toContain('DOC_CONTENTS_MISMATCHED')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update docContents 4 with empty content', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocContents',
//           query: UPDATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: documentId4,
//             content: {},
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc),
//               ''
//             )
//           ).toContain('REQUIRED_DATA_MISSING')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('update an non-existing docContents', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .set('authorization', `bearer ${accessToken}`)
//         .send({
//           operationName: 'UpdateDocContents',
//           query: UPDATE_DOC_CONTENTS.loc.source.body,
//           variables: {
//             userId,
//             documentId: 'D9999',
//             content: { body: 'Hello' },
//           },
//         })
//         .expect(({ body: { errors } }) =>
//           expect(
//             errors.reduce(
//               (acc, cur) => (cur.message.includes('DOC_CONTENTS_NOT_FOUND') ? cur.message : acc),
//               ''
//             )
//           ).toContain('DOC_CONTENTS_NOT_FOUND')
//         )
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
//
// describe('Unit Test: Org1 Queries', () => {
//   it('query commits of document', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetCommitsByDocument',
//           query: GET_COMMITS_BY_DOCUMENT,
//           variables: { documentId: documentId1 },
//         })
//         .expect(({ body: { data } }) => expect(data.getCommitsByDocumentId).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('query commits of loan', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetCommitsByLoanId',
//           query: GET_COMMITS_BY_LOAN,
//           variables: { loanId: loanId3 },
//         })
//         .expect(({ body: { data } }) => expect(data.getCommitsByLoanId).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('query document by id', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetDocumentById',
//           query: GET_DOCUMENT_BY_ID,
//           variables: { documentId: documentId0 },
//         })
//         .expect(({ body: { data } }) => expect(data.getDocumentById).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('query loan 0 by id', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetLoanById',
//           query: GET_LOAN_BY_ID,
//           variables: { loanId: loanId0 },
//         })
//         .expect(({ body: { data } }) => expect(data.getLoanById).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('query loan 1 by id', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetLoanById',
//           query: GET_LOAN_BY_ID,
//           variables: { loanId: loanId1 },
//         })
//         .expect(({ body: { data } }) => expect(data.getLoanById).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('query loan 2 by id', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetLoanById',
//           query: GET_LOAN_BY_ID,
//           variables: { loanId: loanId2 },
//         })
//         .expect(({ body: { data } }) => expect(data.getLoanById).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('query loan 3 by id', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetLoanById',
//           query: GET_LOAN_BY_ID,
//           variables: { loanId: loanId3 },
//         })
//         .expect(({ body: { data } }) => expect(data.getLoanById).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('query loan 4 by id', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetLoanById',
//           query: GET_LOAN_BY_ID,
//           variables: { loanId: loanId4 },
//         })
//         .expect(({ body: { data } }) => expect(data.getLoanById).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
//
//   it('query loan 5 by id', async () => {
//     if (isReady) {
//       await request(gateway)
//         .post('/graphql')
//         .send({
//           operationName: 'GetLoanById',
//           query: GET_LOAN_BY_ID,
//           variables: { loanId: loanId5 },
//         })
//         .expect(({ body: { data } }) => expect(data.getLoanById).toMatchSnapshot())
//         .catch((_) => expect(false).toBeTruthy());
//       return;
//     }
//     expect(false).toBeTruthy();
//   });
// });
