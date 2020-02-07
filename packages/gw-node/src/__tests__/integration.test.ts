// import { FileSystemWallet } from 'fabric-network';

// require('../env'); // Todo: <== need checking again
// import { createPeer, getNetwork, Peer } from '@espresso/fabric-cqrs';
// import {
//   CREATE_USER,
//   GET_COMMITS_BY_USER,
//   GET_USER_BY_ID,
//   GET_USERS_BY_PAGE,
//   User,
//   UserEvents,
//   userReducer,
//   userResolvers,
//   userTypeDefs
// } from '@espresso/model-common';
// import {
//   APPLY_LOAN,
//   APPROVE_LOAN,
//   CANCEL_LOAN,
//   CREATE_DOCUMENT,
//   DELETE_DOCUMENT,
//   Document,
//   DocumentEvents,
//   documentReducer,
//   documentResolvers,
//   documentTypeDefs,
//   EXPIRE_LOAN,
//   GET_COMMITS_BY_DOCUMENT,
//   GET_COMMITS_BY_LOAN,
//   GET_DOCUMENT_BY_ID,
//   GET_LOAN_BY_ID,
//   Loan,
//   LoanEvents,
//   loanReducer,
//   loanResolvers,
//   loanTypeDefs,
//   REJECT_LOAN,
//   RETURN_LOAN,
//   UPDATE_DOCUMENT,
//   UPDATE_LOAN
// } from '@espresso/model-loan';
// import {
//   CREATE_DATA_DOC_CONTENTS,
//   CREATE_FILE_DOC_CONTENTS,
//   CREATE_LOAN_DETAILS,
//   DocContents,
//   DocContentsEvents,
//   docContentsReducer,
//   GET_DOC_CONTENTS_BY_ID,
//   GET_LOAN_DETAILS_BY_ID,
//   LoanDetails,
//   LoanDetailsEvents,
//   loanDetailsReducer,
//   resolvers as privateResolvers,
//   typeDefs as privateTypeDefs,
//   UPDATE_LOAN_DETAILS
// } from '@espresso/model-loan-private';
// import { ApolloServer } from 'apollo-server';
// import { createTestClient } from 'apollo-server-testing';
// import { constructTestServer, getApolloServer } from './__utils__';

// let server;
// let docPeer: Peer;
// let loanPeer: Peer;
// let userPeer: Peer;
// let privatePeer: Peer;
// let documentService: ApolloServer;
// let loanService: ApolloServer;
// let userService: ApolloServer;
// let privateService: ApolloServer;
// const collection = 'Org1PrivateDetails';
// const prefix = 'int_test_';

// const timestamp = Date.now();
// const userId = `u${timestamp}`;
// const loanId = `l${timestamp}`;
// const documentId = `d${timestamp}`;
// const channelEventHubUri = process.env.CHANNEL_HUB;
// const channelName = process.env.CHANNEL_NAME;
// const connectionProfile = process.env.CONNECTION_PROFILE;
// const wallet = new FileSystemWallet(process.env.WALLET);

// beforeAll(async () => {
//   const enrollmentId = 'admin';

//   // Document Service
//   const docNetworkConfig = await getNetwork({
//     enrollmentId,
//     channelEventHubExisted: true,
//     channelEventHub: channelEventHubUri,
//     channelName,
//     connectionProfile,
//     wallet
//   });
//   docPeer = createPeer({
//     ...docNetworkConfig,
//     defaultEntityName: prefix + 'document',
//     defaultReducer: documentReducer,
//     collection,
//     channelEventHubUri,
//     channelName,
//     connectionProfile,
//     wallet
//   });
//   await docPeer.subscribeHub();
//   documentService = getApolloServer({
//     typeDefs: documentTypeDefs,
//     resolvers: documentResolvers,
//     dataSources: () => ({
//       document: {
//         repo: docPeer.getRepository<Document, DocumentEvents>({
//           entityName: prefix + 'document',
//           reducer: documentReducer
//         })
//       }
//     })
//   });
//   await documentService.listen({ port: 14003 });

//   // Loan Service
//   const loanNetworkConfig = await getNetwork({
//     enrollmentId,
//     channelEventHubExisted: true,
//     channelEventHub: channelEventHubUri,
//     channelName,
//     connectionProfile,
//     wallet
//   });
//   loanPeer = createPeer({
//     ...loanNetworkConfig,
//     defaultEntityName: prefix + 'loan',
//     defaultReducer: loanReducer,
//     collection,
//     channelEventHubUri,
//     channelName,
//     connectionProfile,
//     wallet
//   });
//   await loanPeer.subscribeHub();
//   loanService = getApolloServer({
//     typeDefs: loanTypeDefs,
//     resolvers: loanResolvers,
//     dataSources: () => ({
//       loan: {
//         repo: loanPeer.getRepository<Loan, LoanEvents>({
//           entityName: prefix + 'loan',
//           reducer: loanReducer
//         })
//       }
//     })
//   });
//   await loanService.listen({ port: 14002 });

//   // User Service
//   const userNetworkConfig = await getNetwork({
//     enrollmentId,
//     channelEventHubExisted: true,
//     channelEventHub: channelEventHubUri,
//     channelName,
//     connectionProfile,
//     wallet
//   });
//   userPeer = createPeer({
//     ...userNetworkConfig,
//     defaultEntityName: prefix + 'user',
//     defaultReducer: userReducer,
//     collection,
//     channelEventHubUri,
//     channelName,
//     connectionProfile,
//     wallet
//   });
//   await userPeer.subscribeHub();
//   userService = getApolloServer({
//     typeDefs: userTypeDefs,
//     resolvers: userResolvers,
//     dataSources: () => ({
//       user: {
//         repo: userPeer.getRepository<User, UserEvents>({
//           entityName: prefix + 'user',
//           reducer: userReducer
//         })
//       }
//     })
//   });
//   await userService.listen({ port: 14001 });

//   // Private data Service
//   const privateNetworkConfig = await getNetwork({
//     enrollmentId,
//     channelEventHub: channelEventHubUri,
//     channelName,
//     connectionProfile,
//     wallet
//   });
//   privatePeer = createPeer({
//     ...privateNetworkConfig,
//     collection,
//     defaultEntityName: prefix + 'loanDetails',
//     defaultReducer: loanDetailsReducer,
//     channelEventHubUri,
//     channelName,
//     connectionProfile,
//     wallet
//   });
//   privateService = getApolloServer({
//     typeDefs: privateTypeDefs,
//     resolvers: privateResolvers,
//     dataSources: () => ({
//       loanDetails: {
//         repo: privatePeer.getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
//           entityName: prefix + 'loanDetails',
//           reducer: loanDetailsReducer
//         })
//       },
//       docContents: {
//         repo: privatePeer.getPrivateDataRepo<DocContents, DocContentsEvents>({
//           entityName: prefix + 'docContents',
//           reducer: docContentsReducer
//         })
//       }
//     })
//   });
//   await privateService.listen({ port: 14004 });

//   server = await constructTestServer();

//   // Initial data
//   await createTestClient(server).mutate({
//     mutation: CREATE_USER,
//     variables: { name: 'The new User 2', userId: `v${timestamp}` }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_USER,
//     variables: { name: 'The new User 3', userId: `w${timestamp}` }
//   });
//   await createTestClient(server).mutate({
//     mutation: APPLY_LOAN,
//     variables: {
//       loanId: `m${timestamp}`,
//       userId: `v${timestamp}`,
//       reference: 'MYLOAN0001',
//       description: 'loan-description-1'
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: APPLY_LOAN,
//     variables: {
//       loanId: `n${timestamp}`,
//       userId: `v${timestamp}`,
//       reference: 'MYLOAN0002',
//       description: 'loan-description-2'
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_DOCUMENT,
//     variables: {
//       documentId: `e${timestamp}`,
//       loanId: `m${timestamp}`,
//       userId: `v${timestamp}`,
//       title: 'Test Title 101',
//       reference: 'DOC0101'
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_DOCUMENT,
//     variables: {
//       documentId: `f${timestamp}`,
//       loanId: `m${timestamp}`,
//       userId: `w${timestamp}`,
//       title: 'Test Title 102',
//       reference: 'DOC0102'
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_DOCUMENT,
//     variables: {
//       documentId: `g${timestamp}`,
//       loanId: `n${timestamp}`,
//       userId: `v${timestamp}`,
//       title: 'Test Title 103',
//       reference: 'DOC0103'
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_LOAN_DETAILS,
//     variables: {
//       loanId: `m${timestamp}`,
//       userId: `v${timestamp}`,
//       registration: 'BR000000X',
//       companyName: 'Peter Hook Ltd',
//       requesterType: 'Money Launderer',
//       salutation: 'Mr.',
//       contactName: 'Hook',
//       contactTitle: 'Owner',
//       contactPhone: '555-23456',
//       contactEmail: 'hook@fake.it',
//       loanType: 'Post-shipment',
//       startDate: '2019-10-12',
//       tenor: 60,
//       currency: 'HKD',
//       requestedAmt: 70000.0
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_LOAN_DETAILS,
//     variables: {
//       loanId: `n${timestamp}`,
//       userId: `w${timestamp}`,
//       registration: 'BR000000Y',
//       companyName: 'John Locke Ltd',
//       requesterType: 'Gangster',
//       salutation: 'Mr.',
//       contactName: 'Locke',
//       contactTitle: 'Owner',
//       contactPhone: '555-33457',
//       contactEmail: 'crime@fake.it',
//       loanType: 'Post-shipment',
//       startDate: '2019-10-13',
//       tenor: 77,
//       currency: 'HKD',
//       requestedAmt: 210000.0
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_DATA_DOC_CONTENTS,
//     variables: {
//       userId: `v${timestamp}`,
//       documentId: `e${timestamp}`,
//       body: '{ "id": "doc0007", "type": "Airway bill", "ref": "ref0007" }'
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_FILE_DOC_CONTENTS,
//     variables: {
//       userId: `w${timestamp}`,
//       documentId: `f${timestamp}`,
//       format: 'PDF',
//       link: 'localhost/docontent0008'
//     }
//   });
//   await createTestClient(server).mutate({
//     mutation: CREATE_DATA_DOC_CONTENTS,
//     variables: {
//       userId: `v${timestamp}`,
//       documentId: `g${timestamp}`,
//       body: '{ "id": "doc0009", "type": "Bill Lay Ding", "ref": "ref0009" }'
//     }
//   });
// });

// afterAll(async () => {
//   docPeer.unsubscribeHub();
//   loanPeer.unsubscribeHub();
//   userPeer.unsubscribeHub();
//   docPeer.disconnect();
//   loanPeer.disconnect();
//   userPeer.disconnect();
//   privatePeer.disconnect();
//   await documentService.stop();
//   await loanService.stop();
//   await userService.stop();
//   await privateService.stop();
//   await server.stop();
// });

// // To run integration tests:
// // * First time:
// //   - do something networkish...
// // * Each time after bringing down the Fabric network:
// //   1. @[proj root]/network > docker rm logspout -f
// //   2. @[proj root]/network > docker-compose down
// // * Each time if a Fabric network is not up:
// //   1. @[proj root]/network > docker-compose up -d
// //   2. @[proj root]/network > ./monitordocker.sh
// //   3. @[proj root]/packages/admin-tool > yarn run test:install-instantiate-eventstore
// //   4. @[proj root]/packages/admin-tool > yarn run test:install-instantiate-privatedata
// // * Each time:
// //   - yarn test:integtration [-u]

// describe('User Integration Test', () => {
//   it('create user', async () =>
//     createTestClient(server)
//       .mutate({
//         mutation: CREATE_USER,
//         variables: { name: 'The new User', userId }
//       })
//       // .then(data => {
//       //   console.log('create user', data);
//       //   return data;
//       // })
//       .then(({ data: { createUser } }) => expect(createUser.id).toEqual(userId))
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query commits of user', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_COMMITS_BY_USER,
//         variables: { userId: `v${timestamp}` }
//       })
//       .then(({ data: { getCommitsByUserId } }) =>
//         expect(
//           getCommitsByUserId.map(({ entityName, events }) => ({
//             entityName,
//             events
//           }))
//         ).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query user by ID', async () =>
//     createTestClient(server)
//       .query({ query: GET_USER_BY_ID, variables: { userId: `w${timestamp}` } })
//       .then(({ data: { getUserById } }) =>
//         expect(getUserById.name).toEqual('The new User 3')
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query paginated user', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_USERS_BY_PAGE,
//         variables: { cursor: 10 }
//       })
//       .then(({ data: { getPaginatedUser: { total, hasMore, entities } } }) =>
//         expect({
//           getPaginatedUser: {
//             total,
//             hasMore,
//             entities: entities.map(x => x.name)
//           }
//         }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise
// });

// describe('Loan Integration Test', () => {
//   it('apply loan', async () =>
//     createTestClient(server)
//       .mutate({
//         mutation: APPLY_LOAN,
//         variables: {
//           loanId,
//           userId: `w${timestamp}`,
//           reference: 'MYLOAN0001',
//           description: 'test-description'
//         }
//       })
//       .then(({ data: { applyLoan } }) => expect(applyLoan.id).toEqual(loanId))
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query commits of loan', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_COMMITS_BY_LOAN,
//         variables: { loanId: `m${timestamp}` }
//       })
//       .then(({ data: { getCommitsByLoanId } }) =>
//         expect(
//           getCommitsByLoanId.map(({ entityName, events }) => ({
//             entityName,
//             events
//           }))
//         ).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query loan by ID', async () =>
//     createTestClient(server)
//       .query({ query: GET_LOAN_BY_ID, variables: { loanId: `m${timestamp}` } })
//       .then(({ data: { getLoanById: { description, reference, status } } }) =>
//         expect({ description, reference, status }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise
// });

// describe('Loan Details Integration Test', () => {
//   it('create loan details', async () =>
//     createTestClient(server)
//       .mutate({
//         mutation: CREATE_LOAN_DETAILS,
//         variables: {
//           loanId,
//           userId: `v${timestamp}`,
//           registration: 'BR0000001',
//           companyName: 'Pete N Co. Ltd',
//           requesterType: 'Money Launderer',
//           salutation: 'Mr.',
//           contactName: 'Pete',
//           contactTitle: 'Owner',
//           contactPhone: '555-12345',
//           contactEmail: 'pete@fake.it',
//           loanType: 'Post-shipment',
//           startDate: '2019-10-11',
//           tenor: 60,
//           currency: 'HKD',
//           requestedAmt: 50000.0
//         }
//       })
//       .then(({ data: { createLoanDetails } }) =>
//         expect(createLoanDetails.id).toEqual(loanId)
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query loan details by ID', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_LOAN_DETAILS_BY_ID,
//         variables: { loanId: `m${timestamp}` }
//       })
//       // .then(data => {
//       //   console.log('query loan details by ID', data.data.getLoanDetailsById);
//       //   return data;
//       // })
//       .then(
//         ({
//           data: {
//             getLoanDetailsById: {
//               requester,
//               contact,
//               loanType,
//               startDate,
//               tenor,
//               currency,
//               requestedAmt,
//               approvedAmt,
//               comment
//             }
//           }
//         }) =>
//           expect({
//             requester,
//             contact,
//             loanType,
//             startDate,
//             tenor,
//             currency,
//             requestedAmt,
//             approvedAmt,
//             comment
//           }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query loan details again by ID', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_LOAN_DETAILS_BY_ID,
//         variables: { loanId: `n${timestamp}` }
//       })
//       .then(
//         ({
//           data: {
//             getLoanDetailsById: {
//               requester,
//               contact,
//               loanType,
//               startDate,
//               tenor,
//               currency,
//               requestedAmt,
//               approvedAmt,
//               comment
//             }
//           }
//         }) =>
//           expect({
//             requester,
//             contact,
//             loanType,
//             startDate,
//             tenor,
//             currency,
//             requestedAmt,
//             approvedAmt,
//             comment
//           }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise
// });

// describe('Document Integration Test', () => {
//   it('create document', async () =>
//     createTestClient(server)
//       .mutate({
//         mutation: CREATE_DOCUMENT,
//         variables: {
//           documentId,
//           userId,
//           loanId,
//           title: 'test-title',
//           reference: 'DOCREF0001'
//         }
//       })
//       .then(({ data: { createDocument } }) =>
//         expect(createDocument.id).toEqual(documentId)
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query commits of document', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_COMMITS_BY_DOCUMENT,
//         variables: { documentId: `e${timestamp}` }
//       })
//       .then(({ data: { getCommitsByDocumentId } }) =>
//         expect(
//           getCommitsByDocumentId.map(({ entityName, events }) => ({
//             entityName,
//             events
//           }))
//         ).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query eocument by ID', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_DOCUMENT_BY_ID,
//         variables: { documentId: `e${timestamp}` }
//       })
//       // .then(data => {
//       //   console.log('query eocument by ID', data.data.getDocumentById);
//       //   return data;
//       // })
//       .then(({ data: { getDocumentById: { title, reference, status } } }) =>
//         expect({ title, reference, status }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query focument by ID', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_DOCUMENT_BY_ID,
//         variables: { documentId: `f${timestamp}` }
//       })
//       // .then(data => {
//       //   console.log('query focument by ID', data.data.getDocumentById);
//       //   return data;
//       // })
//       .then(({ data: { getDocumentById: { title, reference, status } } }) =>
//         expect({ title, reference, status }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query gocument by ID', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_DOCUMENT_BY_ID,
//         variables: { documentId: `g${timestamp}` }
//       })
//       .then(({ data: { getDocumentById: { title, reference, status } } }) =>
//         expect({ title, reference, status }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('delete document', done => {
//     const { query, mutate } = createTestClient(server);
//     return mutate({
//       mutation: DELETE_DOCUMENT,
//       variables: { userId: `v${timestamp}`, documentId: `f${timestamp}` }
//     }).then(_ =>
//       setTimeout(async () => {
//         query({
//           query: GET_DOCUMENT_BY_ID,
//           variables: { documentId: `f${timestamp}` }
//         })
//           // .then(data => {
//           //   console.log('query deleted document by ID', data.data.getDocumentById);
//           //   return data;
//           // })
//           .then(
//             ({
//               data: {
//                 getDocumentById: { documentId: docId, status }
//               }
//             }) => {
//               expect(docId).toEqual(`f${timestamp}`);
//               expect(status).toEqual(1);
//             }
//           );
//         done();
//       }, 500)
//     );
//   });

//   it('delete non-existing document', async () =>
//     createTestClient(server)
//       .mutate({
//         mutation: DELETE_DOCUMENT,
//         variables: { userId: `v${timestamp}`, documentId: '990000109' }
//       })
//       .then(({ errors }) =>
//         expect(
//           errors &&
//             errors.length > 0 &&
//             errors[0].message === 'DOCUMENT_NOT_FOUND: id: 990000109'
//         ).toBeTruthy()
//       ));
// });

// describe('Doc Contents Integration Test', () => {
//   it('create doc contents', async () =>
//     createTestClient(server)
//       .mutate({
//         mutation: CREATE_FILE_DOC_CONTENTS,
//         variables: {
//           userId: `w${timestamp}`,
//           documentId,
//           format: 'PDF',
//           link: 'localhost/docontent0006'
//         }
//       })
//       .then(({ data: { createFileDocContents } }) =>
//         expect(createFileDocContents.id).toEqual(documentId)
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query doc content by ID', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_DOC_CONTENTS_BY_ID,
//         variables: { documentId: `f${timestamp}` }
//       })
//       // .then(data => {
//       //   console.log('peer-node/integration.test.ts - GET_DOC_CONTENTS_BY_ID 001', data.data.getDocContentsById);
//       //   return data;
//       // })
//       .then(({ data: { getDocContentsById: { content: { format, link } } } }) =>
//         expect({ format, link }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('query doc content again by ID', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_DOC_CONTENTS_BY_ID,
//         variables: { documentId: `g${timestamp}` }
//       })
//       .then(({ data: { getDocContentsById: { content: { body } } } }) =>
//         expect({ body }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise
// });

// describe('Federated queries', () => {
//   it('federated query loan by ID', done =>
//     setTimeout(async () => {
//       await createTestClient(server)
//         .query({
//           query: GET_LOAN_BY_ID,
//           variables: { loanId: `m${timestamp}` }
//         })
//         // .then(data => {
//         //   console.log('peer-node/integration.test.ts - GET_LOAN_BY_ID', data.data.getLoanById);
//         //   return data;
//         // })
//         .then(
//           ({
//             data: {
//               getLoanById: {
//                 description,
//                 reference,
//                 status,
//                 documents,
//                 details: {
//                   requester: { registration, name: companyName },
//                   contact: { name: contactName, phone, email },
//                   loanType,
//                   startDate,
//                   tenor,
//                   currency,
//                   requestedAmt
//                 }
//               }
//             }
//           }) =>
//             expect({
//               description,
//               reference,
//               status,
//               documents: documents.map(x => ({
//                 reference: x.reference,
//                 status: x.status,
//                 title: x.title
//               })),
//               details: {
//                 requester: { registration, companyName },
//                 contact: { contactName, phone, email },
//                 loanType,
//                 startDate,
//                 tenor,
//                 currency,
//                 requestedAmt
//               }
//             }).toMatchSnapshot()
//         )
//         .catch(_ => expect(false).toBeTruthy()); // Normally should not enter here, force the test to fail otherwise
//       done();
//     }, 100));

//   it('federated query document by ID', done =>
//     setTimeout(async () => {
//       await createTestClient(server)
//         .query({
//           query: GET_DOCUMENT_BY_ID,
//           variables: { documentId: `f${timestamp}` }
//         })
//         // .then(data => {
//         //   console.log('peer-node/integration.test.ts - GET_DOCUMENT_BY_ID', data.data.getDocumentById);
//         //   return data;
//         // })
//         .then(
//           ({
//             data: {
//               getDocumentById: {
//                 title,
//                 reference,
//                 status,
//                 loan: { description, reference: ref, status: sts },
//                 contents: {
//                   content: { format, link }
//                 }
//               }
//             }
//           }) =>
//             expect({
//               title,
//               reference,
//               status,
//               loan: { description, reference: ref, status: sts },
//               contents: { content: { format, link } }
//             }).toMatchSnapshot()
//         )
//         .catch(_ => expect(false).toBeTruthy()); // Normally should not enter here, force the test to fail otherwise
//       done();
//     }, 100));

//   it('federated query loan details by ID', async () =>
//     createTestClient(server)
//       .query({ query: GET_LOAN_DETAILS_BY_ID, variables: { loanId } })
//       .then(
//         ({
//           data: {
//             getLoanDetailsById: {
//               loan: { description, reference, status },
//               requester,
//               contact,
//               loanType,
//               startDate,
//               tenor,
//               currency,
//               requestedAmt,
//               approvedAmt,
//               comment
//             }
//           }
//         }) =>
//           expect({
//             loan: { description, reference, status },
//             requester,
//             contact,
//             loanType,
//             startDate,
//             tenor,
//             currency,
//             requestedAmt,
//             approvedAmt,
//             comment
//           }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise

//   it('federated query doc contents by ID', async () =>
//     createTestClient(server)
//       .query({
//         query: GET_DOC_CONTENTS_BY_ID,
//         variables: { documentId: `f${timestamp}` }
//       })
//       // .then(data => {
//       //   console.log('peer-node/integration.test.ts - GET_DOC_CONTENTS_BY_ID 001', data.data.getDocContentsById);
//       //   return data;
//       // })
//       .then(
//         ({
//           data: {
//             getDocContentsById: {
//               document: { title, reference, status },
//               content: { format, link }
//             }
//           }
//         }) =>
//           expect({
//             document: { title, reference, status },
//             content: { format, link }
//           }).toMatchSnapshot()
//       )
//       .catch(_ => expect(false).toBeTruthy())); // Normally should not enter here, force the test to fail otherwise
// });
