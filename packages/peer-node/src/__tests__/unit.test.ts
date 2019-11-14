import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import {
  CREATE_DOCUMENT,
  DELETE_DOCUMENT,
  GET_COMMITS_BY_DOCUMENT,
  GET_DOCUMENT_BY_ID,
  resolvers as docResolvers,
  RESTRICT_DOCUMENT_ACCESS,
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
  typeDefs as loanTypeDefs
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
  GET_COMMITS_BY_DETAILS,
  GET_DETAILS_BY_ID,
  resolvers as privatedataResolvers,
  typeDefs as privatedataTypeDefs
} from '../privatedata';
import {
  constructTestServer,
  documentRepo,
  getApolloServer,
  loanRepo,
  userRepo
} from './__utils__';
import { localRepo } from './__utils__/mock-privatedata';

let server;
let documentService: ApolloServer;
let loanService: ApolloServer;
let userService: ApolloServer;
let privatedataService: ApolloServer;

beforeAll(async () => {
  documentService = getApolloServer({
    typeDefs: docTypeDefs,
    resolvers: docResolvers,
    dataSources: () => ({
      docDataSource: { repo: documentRepo },
      userDataSource: { repo: userRepo },
      loanDataSource: { repo: loanRepo }
    })
  });
  await documentService.listen({ port: 14001 });

  loanService = getApolloServer({
    typeDefs: loanTypeDefs,
    resolvers: loanResolvers,
    dataSources: () => ({
      userDataSource: { repo: userRepo },
      loanDataSource: { repo: loanRepo }
    })
  });
  await loanService.listen({ port: 14002 });

  userService = getApolloServer({
    typeDefs: userTypeDefs,
    resolvers: userResolvers,
    dataSources: () => ({
      userDataSource: { repo: userRepo }
    })
  });
  await userService.listen({ port: 14004 });

  privatedataService = getApolloServer({
    typeDefs: privatedataTypeDefs,
    resolvers: privatedataResolvers,
    dataSources: () => ({
      localDataSource: { privatedataRepo: localRepo }
    })
  });
  await privatedataService.listen({ port: 14003 });
  server = await constructTestServer();
});

afterAll(async () => {
  await documentService.stop();
  await loanService.stop();
  await userService.stop();
  await privatedataService.stop();
});

describe('User Entity: Unit Test', () => {
  it('should query: getUserById', async () =>
    createTestClient(server)
      .query({
        query: GET_USER_BY_ID,
        variables: { userId: 'example@gmail.com' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getCommitsByUserId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_USER,
        variables: { userId: 'example@gmail.com' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should create user', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_USER,
        variables: {
          name: 'Create Test User',
          userId: 'test@gmail.com'
        }
      })
      .then(({ data: { createUser: { id } } }) =>
        expect(id).toEqual('test@gmail.com')
      ));
});

describe('Loan Entity: Unit Test', () => {
  it('should query: getLoanById', async () =>
    createTestClient(server)
      .query({
        query: GET_LOAN_BY_ID,
        variables: { loanId: '1542385172441' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getCommitsByLoanId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_LOAN,
        variables: { loanId: '1542385172441' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should create loan', async () =>
    createTestClient(server)
      .mutate({
        mutation: APPLY_LOAN,
        variables: {
          loanId: '123123123',
          userId: 'example@gmail.com',
          reference: 'MYTRADE0001',
          loaner: 'LOANER0003',
          description: 'test-description'
        }
      })
      .then(({ data: { applyLoan: { id } } }) =>
        expect(id).toEqual('123123123')
      ));
});

describe('Document Entity: Unit Test', () => {
  it('should query: getDocumentById', async () =>
    createTestClient(server)
      .query({
        query: GET_DOCUMENT_BY_ID,
        variables: { documentId: '1542385173331' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getCommitByDocumentId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_DOCUMENT,
        variables: { documentId: '1542385172441' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should create document', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          documentId: '321321321',
          loanId: '123123123',
          userId: 'example@gmail.com',
          title: 'test-title',
          reference: 'DOC0009',
          link: 'test-link-0009'
        }
      })
      .then(({ data: { createDocument: { id } } }) =>
        expect(id).toEqual('321321321')
      ));

  // it('should query Loan and Document', async () =>
  //   createTestClient(server)
  //     .query({
  //       query: TRADE_DOC_BY_ID,
  //       variables: { id: '123123123' }
  //     })
  //     .then(({ data }) => expect(data).toMatchSnapshot()));
});

describe('LoanDetails: Unit Test', () => {
  // it('should create EtcPo', async () =>
  //   createTestClient(server)
  //     .query({
  //       query: CREATE_LOAN_DETAILS,
  //       variables: {
  //         id: '321321321',
  //         userId: 'example@gmail.com',
  //         body: 'etc po details'
  //       }
  //     })
  //     .then(({ data: { createLoanDetails: { id } } }) =>
  //       expect(id).toEqual('321321321')
  //     ));

  it('should query: getLoanDetailsById', async () =>
    createTestClient(server)
      .query({
        query: GET_DETAILS_BY_ID,
        variables: { id: '321321321' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  // it('should run federated query: getDocumentEtcById', async () =>
  //   createTestClient(server)
  //     .query({
  //       query: DOCUMENT_ETCPO_BY_ID,
  //       variables: { id: '321321321' }
  //     })
  //     .then(({ data }) => expect(data).toMatchSnapshot()));
});
