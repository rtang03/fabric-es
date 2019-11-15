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
  GET_DETAILS_BY_ID,
  resolvers as localResolvers,
  typeDefs as localTypeDefs
} from '../local';
import {
  constructTestServer,
  documentRepo,
  getApolloServer,
  loanDetailsRepo,
  loanRepo,
  userRepo
} from './__utils__';

let server;
let documentService: ApolloServer;
let loanService: ApolloServer;
let userService: ApolloServer;
let localService: ApolloServer;

beforeAll(async () => {
  documentService = getApolloServer({
    typeDefs: docTypeDefs,
    resolvers: docResolvers,
    dataSources: () => ({
      docDataSource: { repo: documentRepo },
      userDataSource: { repo: userRepo }
    })
  });
  await documentService.listen({ port: 14001 });

  loanService = getApolloServer({
    typeDefs: loanTypeDefs,
    resolvers: loanResolvers,
    dataSources: () => ({
      loanDataSource: { repo: loanRepo },
      userDataSource: { repo: userRepo }
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

  localService = getApolloServer({
    typeDefs: localTypeDefs,
    resolvers: localResolvers,
    dataSources: () => ({
      loanDetailsDataSource: { repo: loanDetailsRepo }
    })
  });
  await localService.listen({ port: 14003 });
  server = await constructTestServer();
});

afterAll(async () => {
  await documentService.stop();
  await loanService.stop();
  await userService.stop();
  await localService.stop();
});

describe('User Entity: Unit Test', () => {
  it('query: getUserById', async () =>
    createTestClient(server)
      .query({
        query: GET_USER_BY_ID,
        variables: { userId: 'josh@fake.it' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('query: getCommitsByUserId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_USER,
        variables: { userId: 'josh@fake.it' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('mutation: createUser', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_USER,
        variables: {
          name: 'Pete',
          userId: 'pete@fake.it'
        }
      })
      .then(({ data: { createUser: { id } } }) =>
        expect(id).toEqual('pete@fake.it')
      ));
});

describe('Document Entity: Unit Test', () => {
  it('query: getDocumentById', async () =>
    createTestClient(server)
      .query({
        query: GET_DOCUMENT_BY_ID,
        variables: { documentId: '1542385173331' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('query: getCommitByDocumentId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_DOCUMENT,
        variables: { documentId: '1542385173331' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('create document', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          documentId: '321321321',
          userId: 'josh@fake.it',
          title: 'test-title',
          reference: 'DOC0009',
          link: 'test-link-0009'
        }
      })
      // .then(data => {
      //   console.log('YO', data);
      //   return data;
      // })
      .then(({ data: { createDocument: { id } } }) =>
        expect(id).toEqual('321321321')
      ));
});

describe('Loan Entity: Unit Test', () => {
  it('query: getCommitsByLoanId', async () =>
    createTestClient(server)
      .query({
        query: GET_COMMITS_BY_LOAN,
        variables: { loanId: '123456' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('create loan', async () =>
    createTestClient(server)
      .mutate({
        mutation: APPLY_LOAN,
        variables: {
          loanId: '123123123',
          userId: 'josh@fake.it',
          reference: 'MYTRADE0001',
          loaner: 'LOANER0003',
          description: 'test-description'
        }
      })
      .then(({ data: { applyLoan: { id } } }) =>
        expect(id).toEqual('123123123')
      ));

  it('federated query: getLoanById', async () =>
    createTestClient(server)
      .query({
        query: GET_LOAN_BY_ID,
        variables: { loanId: '123456' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));
});

describe('LoanDetails: Unit Test', () => {
  it('mutation: createLoanDetails', async () =>
    createTestClient(server)
      .mutate({
        mutation: CREATE_LOAN_DETAILS,
        variables: {
          loanId: '321321321',
          userId: 'example@gmail.com',
          registration: 'BR0000001',
          companyName: 'Pete N Co. Ltd',
          requesterType: 'Money Launderer',
          salutation: 'Mr.',
          contactName: 'Pete',
          contactTitle: 'Owner',
          contactPhone: '555-12345',
          contactEmail: 'pete@fake.it',
          loanType: 'Post-shipment',
          startDate: '2019-10-11',
          tenor: 60,
          currency: 'HKD',
          requestedAmt: 50000.0
        }
      })
      // .then(data => {
      //   console.log('YO', data);
      //   return data;
      // })
      .then(({ data: { createLoanDetails: { id } } }) =>
        expect(id).toEqual('321321321')
      ));

  it('federated query: getLoanDetailsById', async () =>
    createTestClient(server)
      .query({
        query: GET_DETAILS_BY_ID,
        variables: { loanId: '123456' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));
});
