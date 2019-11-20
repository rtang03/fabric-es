require('dotenv').config();
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
import { createPeer, getNetwork, Peer } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
// import { omit, pick } from 'lodash';
import {
  CREATE_DOCUMENT,
  GET_DOCUMENT_BY_ID,
  resolvers as docResolvers,
  typeDefs as docTypeDefs
} from '../common/document';
import {
  APPLY_LOAN,
  APPROVE_LOAN,
  CANCEL_LOAN,
  EXPIRE_LOAN,
  GET_COMMITS_BY_LOAN,
  GET_LOAN_BY_ID,
  REJECT_LOAN,
  resolvers as loanResolvers,
  RETURN_LOAN,
  typeDefs as loanTypeDefs,
  UPDATE_LOAN
} from '../common/loan';
import {
  CREATE_USER,
  GET_COMMITS_BY_USER,
  GET_USER_BY_ID,
  GET_USERS_BY_PAGE,
  resolvers as userResolvers,
  typeDefs as userTypeDefs
} from '../common/user';
import {
  CREATE_LOAN_DETAILS,
  GET_DETAILS_BY_ID,
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  resolvers as privateResolvers,
  typeDefs as privateTypeDefs,
  UPDATE_LOAN_DETAILS
} from '../private';
import { constructTestServer, getApolloServer } from './__utils__';

let server;
// let docPeer: Peer;
// let loanPeer: Peer;
let userPeer: Peer;
// let privatePeer: Peer;
// let documentService: ApolloServer;
// let loanService: ApolloServer;
let userService: ApolloServer;
// let privateService: ApolloServer;
// let docNetworkConfig;
// let loanNetworkConfig;
let userNetworkConfig;
// let privateNetworkConfig;
const collection = 'Org1PrivateDetails';
const prefix = 'int_test_';

beforeAll(async () => {
  const enrollmentId = 'admin';

  // Document Service
  // docNetworkConfig = await getNetwork({
  //   enrollmentId,
  //   channelEventHubExisted: true
  // });
  // docPeer = createPeer({
  //   ...docNetworkConfig,
  //   collection,
  //   reducer: documentReducer
  // });
  // await docPeer.subscribeHub();
  // documentService = getApolloServer({
  //   typeDefs: docTypeDefs,
  //   resolvers: docResolvers,
  //   dataSources: () => ({
  //     docDataSource: {
  //       repo: docPeer.getRepository<Document, DocumentEvents>({
  //         entityName: prefix + 'document',
  //         reducer: documentReducer
  //       })
  //     },
  //     loanDataSource: {
  //       repo: docPeer.getRepository<Loan, LoanEvents>({
  //         entityName: prefix + 'loan',
  //         reducer: loanReducer
  //       })
  //     },
  //     userDataSource: {
  //       repo: docPeer.getRepository<User, UserEvents>({
  //         entityName: prefix + 'user',
  //         reducer: userReducer
  //       })
  //     }
  //   })
  // });
  // await documentService.listen({ port: 14001 });

  // Loan Service
  // loanNetworkConfig = await getNetwork({
  //   enrollmentId,
  //   channelEventHubExisted: true
  // });
  // loanPeer = createPeer({
  //   ...loanNetworkConfig,
  //   collection,
  //   reducer: documentReducer
  // });
  // await loanPeer.subscribeHub();
  // loanService = getApolloServer({
  //   typeDefs: loanTypeDefs,
  //   resolvers: loanResolvers,
  //   dataSources: () => ({
  //     userDataSource: {
  //       repo: loanPeer.getRepository<User, UserEvents>({
  //         entityName: prefix + 'user',
  //         reducer: userReducer
  //       })
  //     },
  //     loanDataSource: {
  //       repo: loanPeer.getRepository<Loan, LoanEvents>({
  //         entityName: prefix + 'loan',
  //         reducer: loanReducer
  //       })
  //     }
  //   })
  // });
  // await loanService.listen({ port: 14002 });

  // User Service
  userNetworkConfig = await getNetwork({
    enrollmentId,
    channelEventHubExisted: true
  });
  userPeer = createPeer({
    ...userNetworkConfig,
    collection,
    reducer: userReducer
  });
  await userPeer.subscribeHub();
  userService = getApolloServer({
    typeDefs: userTypeDefs,
    resolvers: userResolvers,
    dataSources: () => ({
      userDataSource: {
        repo: userPeer.getRepository<User, UserEvents>({
          entityName: prefix + 'user',
          reducer: userReducer
        })
      }
    })
  });
  await userService.listen({ port: 14004 });

  // Private data Service
  // privateNetworkConfig = await getNetwork({ enrollmentId });
  // privatePeer = createPeer({
  //   ...privateNetworkConfig,
  //   collection,
  //   reducer: loanDetailsReducer
  // });
  // privateService = getApolloServer({
  //   typeDefs: privateTypeDefs,
  //   resolvers: privateResolvers,
  //   dataSources: () => ({
  //     privateDataSource: {
  //       privatedataRepo: privatePeer.getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({
  //         entityName: prefix + 'private',
  //         reducer: loanDetailsReducer
  //       })
  //     }
  //   })
  // });
  // await privateService.listen({ port: 14003 });

  server = await constructTestServer();

  // await createTestClient(server).mutate({ mutation: CREATE_USER, variables: {
  //   name: 'Test User', userId: 'test@fake.it'
  // }});
});

afterAll(async () => {
  // docPeer.unsubscribeHub();
  // loanPeer.unsubscribeHub();
  userPeer.unsubscribeHub();
  // docPeer.disconnect();
  // loanPeer.disconnect();
  userPeer.disconnect();
  // privatePeer.disconnect();
  // await documentService.stop();
  // await loanService.stop();
  await userService.stop();
  // await privateService.stop();
  await server.stop();
});

// let commitId: string;

describe('User Entity: Integration Test', () => {
  it('create user', async () =>
    createTestClient(server)
      .query({
        query: CREATE_USER,
        variables: {
          name: 'New User',
          userId: 'new@fake.it'
        }
      })
      .then(data => {
        console.log('create user', data);
        return data;
      })
      .then(({ data: { createUser } }) => expect(createUser.id).toEqual('new@fake.it'))
      .catch(_ => expect(false).toBeTruthy()) // Normally should not enter here, force the test to fail otherwise
  );

  it('query user by ID', async () =>
    createTestClient(server).query({ query: GET_USER_BY_ID, variables: { userId: 'new@fake.it' }})
      .then(data => {
        console.log('user by ID', data);
        return data;
      })
      .then(({ data }) => expect(data).toMatchSnapshot())
      .catch(_ => expect(false).toBeTruthy()) // Normally should not enter here, force the test to fail otherwise
  );

  it('query commits of user', async () =>
    createTestClient(server).query({ query: GET_COMMITS_BY_USER, variables: { userId: 'new@fake.it' }})
      .then(({ data }) => {
        console.log('commits of user', data.getCommitsByUserId);
        return data;
      })
      .then(({ data }) => expect(data).toMatchSnapshot())
      .catch(_ => expect(false).toBeTruthy()) // Normally should not enter here, force the test to fail otherwise
  );

//   it('should run QUERIES', done =>
//     setTimeout(async () => {
//       // await createTestClient(server)
//       //   .query({ query: USERS })
//       //   .then(({ data }) => expect(data).toMatchSnapshot());

//       await createTestClient(server)
//         .query({
//           query: GET_USERS_BY_PAGE,
//           variables: { cursor: 10 }
//         })
//         .then(({ data }) => expect(data).toMatchSnapshot());

//       await createTestClient(server)
//         .query({
//           query: GET_USER_BY_ID,
//           variables: { id: 'test@fake.it' }
//         })
//         .then(({ data }) => expect(data).toMatchSnapshot());

//       await createTestClient(server)
//         .query({
//           query: GET_COMMITS_BY_USER,
//           variables: { id: 'test@fake.it' }
//         })
//         .then(({ data: { getCommitByUserId } }) => getCommitByUserId)
//         .then(commits => omit(commits[0], 'commitId', 'committedAt'))
//         .then(result => expect(result).toMatchSnapshot());

//       done();
//     }, 5000));
// });

// describe('Trade Entity: Integration Test', () => {
//   it('should create trade', async () =>
//     createTestClient(server)
//       .query({
//         query: CREATE_TRADE,
//         variables: {
//           tradeId: '123123123',
//           userId: 'test@gmail.com',
//           title: 'test-title',
//           description: 'test-description'
//         }
//       })
//       .then(({ data: { createTrade } }) => createTrade)
//       .then(commit => pick(commit, 'id', 'entityName', 'version'))
//       .then(result => expect(result).toMatchSnapshot()));
// });

// describe('Document Entity: Integration Test', () => {
//   it('should create document', async () =>
//     createTestClient(server)
//       .query({
//         query: CREATE_DOCUMENT,
//         variables: {
//           documentId: '321321321',
//           tradeId: '123123123',
//           userId: 'test@gmail.com',
//           title: 'test-title',
//           description: 'test-description',
//           link: 'test-link'
//         }
//       })
//       .then(({ data: { createDocument } }) => createDocument)
//       .then(commit => pick(commit, 'id', 'entityName', 'version'))
//       .then(result => expect(result).toMatchSnapshot()));
// });

// describe('Etc Privatedata: Integration Test', () => {
//   it('should create EtcPo', async () =>
//     createTestClient(server)
//       .query({
//         query: CREATE_ETCPO,
//         variables: {
//           id: '321321321',
//           userId: 'test@gmail.com',
//           body: 'etc po details'
//         }
//       })
//       .then(({ data: { createEtcPo } }) => createEtcPo)
//       .then(commit => pick(commit, 'id', 'entityName', 'version'))
//       .then(result => expect(result).toMatchSnapshot()));

//   it('should query: getEtcPoById', async () =>
//     createTestClient(server)
//       .query({ query: ETCPO_BY_ID, variables: { id: '321321321' } })
//       .then(({ data }) => expect(data).toMatchSnapshot()));

//   it('should run federated query: getDocumentEtcById', async () =>
//     createTestClient(server)
//       .query({ query: DOCUMENT_ETCPO_BY_ID, variables: { id: '321321321' } })
//       .then(({ data }) => expect(data).toMatchSnapshot()));
});
