import { createTestClient } from 'apollo-server-testing';
import {
  ABOUT_DOCUMENT,
  CREATE_DOCUMENT,
  DOCUMENT_BY_ID,
  DOCUMENT_COMMITS,
  DOCUMENT_ETCPO_BY_ID,
  DOCUMENTS,
  PAGINATED_DOCUMENT,
  resolvers as docResolvers,
  typeDefs as docTypeDefs
} from '../document';
import {
  ABOUT_ETCPO,
  CREATE_ETCPO,
  ETCPO_BY_ID,
  resolvers as privatedataResolvers,
  typeDefs as privatedataTypeDefs
} from '../privatedata';
import {
  ABOUT_TRADE,
  CREATE_TRADE,
  PAGINATED_TRADE,
  resolvers as tradeResolvers,
  TRADE_BY_ID,
  TRADE_COMMITS,
  TRADE_DOC_BY_ID,
  TRADES,
  typeDefs as tradeTypeDefs
} from '../trade';
import {
  ABOUT_USER,
  CREATE_USER,
  PAGINATED_USER,
  USER_BY_ID,
  USER_COMMITS,
  USERS
} from '../user';
import {
  constructTestServer,
  documentRepo,
  getApolloServer,
  tradeRepo,
  userRepo
} from './__utils__';
import { etcPoRepo } from './__utils__/mock-privatedata';

let server;
let documentService;
let tradeService;
let privatedataService;

beforeAll(async () => {
  documentService = getApolloServer({
    typeDefs: docTypeDefs,
    resolvers: docResolvers,
    dataSources: () => ({
      docDataSource: { repo: documentRepo },
      userDataSource: { repo: userRepo },
      tradeDataSource: { repo: tradeRepo }
    })
  });
  await documentService.listen({ port: 14001 });

  tradeService = getApolloServer({
    typeDefs: tradeTypeDefs,
    resolvers: tradeResolvers,
    dataSources: () => ({
      userDataSource: { repo: userRepo },
      tradeDataSource: { repo: tradeRepo }
    })
  });
  await tradeService.listen({ port: 14002 });

  privatedataService = getApolloServer({
    typeDefs: privatedataTypeDefs,
    resolvers: privatedataResolvers,
    dataSources: () => ({
      etcDataSource: { privatedataRepo: etcPoRepo }
    })
  });
  await privatedataService.listen({ port: 14003 });
  server = await constructTestServer();
});

afterAll(async () => {
  await documentService.stop();
  await tradeService.stop();
  await privatedataService.stop();
});

describe('User Entity: Unit Test', () => {
  it('should return AboutUser', async () =>
    createTestClient(server)
      .query({ query: ABOUT_USER })
      .then(({ data }) => expect(data).toEqual({ aboutUser: 'User Entity' })));

  it('should query: getAllUser', async () =>
    createTestClient(server)
      .query({ query: USERS })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getPaginatedUser', async () =>
    createTestClient(server)
      .query({
        query: PAGINATED_USER,
        variables: { cursor: 10 }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getUserById', async () =>
    createTestClient(server)
      .query({
        query: USER_BY_ID,
        variables: { id: 'example@gmail.com' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getCommitByUserId', async () =>
    createTestClient(server)
      .query({
        query: USER_COMMITS,
        variables: { id: 'example@gmail.com' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should create user', async () =>
    createTestClient(server)
      .query({
        query: CREATE_USER,
        variables: {
          name: 'Create Test User',
          userId: 'test@gmail.com'
        }
      })
      .then(({ data: { createUser: { id } } }) =>
        expect(id).toEqual('test@gmail.com')
      ));

  // todo: subscription
});

describe('Trade Entity: Unit Test', () => {
  it('should return AboutTrade', async () =>
    createTestClient(server)
      .query({ query: ABOUT_TRADE })
      .then(({ data }) =>
        expect(data).toEqual({ aboutTrade: 'Trade Entity' })
      ));

  it('should query: getAllTrade', async () =>
    createTestClient(server)
      .query({ query: TRADES })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getPaginatedTrade', async () =>
    createTestClient(server)
      .query({
        query: PAGINATED_TRADE,
        variables: { cursor: 10 }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getTradeById', async () =>
    createTestClient(server)
      .query({
        query: TRADE_BY_ID,
        variables: { id: '1542385172441' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getCommitByTradeId', async () =>
    createTestClient(server)
      .query({
        query: TRADE_COMMITS,
        variables: { id: '1542385172441' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should create trade', async () =>
    createTestClient(server)
      .query({
        query: CREATE_TRADE,
        variables: {
          tradeId: '123123123',
          userId: 'test@gmail.com',
          title: 'test-title',
          description: 'test-description'
        }
      })
      .then(({ data: { createTrade: { id } } }) =>
        expect(id).toEqual('123123123')
      ));
});

describe('Document Entity: Unit Test', () => {
  it('should return AboutDocument', async () =>
    createTestClient(server)
      .query({ query: ABOUT_DOCUMENT })
      .then(({ data }) =>
        expect(data).toEqual({ aboutDocument: 'Document Entity' })
      ));

  it('should query: getAllDocument', async () =>
    createTestClient(server)
      .query({ query: DOCUMENTS })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getPaginatedTrade', async () =>
    createTestClient(server)
      .query({
        query: PAGINATED_DOCUMENT,
        variables: { cursor: 10 }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getDocumentById', async () =>
    createTestClient(server)
      .query({
        query: DOCUMENT_BY_ID,
        variables: { id: '1542385173331' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should query: getCommitByDocumentId', async () =>
    createTestClient(server)
      .query({
        query: DOCUMENT_COMMITS,
        variables: { id: '1542385172441' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should create document', async () =>
    createTestClient(server)
      .query({
        query: CREATE_DOCUMENT,
        variables: {
          documentId: '321321321',
          tradeId: '123123123',
          userId: 'test@gmail.com',
          title: 'test-title',
          description: 'test-description',
          link: 'test-link'
        }
      })
      .then(({ data: { createDocument: { id } } }) =>
        expect(id).toEqual('321321321')
      ));

  it('should query Trade and Document', async () =>
    createTestClient(server)
      .query({
        query: TRADE_DOC_BY_ID,
        variables: { id: '123123123' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));
});

describe('EtcPo: Unit Test', () => {
  it('should return AboutEtcPo', async () =>
    createTestClient(server)
      .query({ query: ABOUT_ETCPO })
      .then(({ data }) => expect(data).toEqual({ aboutEtcPo: 'Etc Po Info' })));

  it('should create EtcPo', async () =>
    createTestClient(server)
      .query({
        query: CREATE_ETCPO,
        variables: {
          id: '321321321',
          userId: 'test@gmail.com',
          body: 'etc po details'
        }
      })
      .then(({ data: { createEtcPo: { id } } }) =>
        expect(id).toEqual('321321321')
      ));

  it('should query: getEtcPoById', async () =>
    createTestClient(server)
      .query({
        query: ETCPO_BY_ID,
        variables: { id: '321321321' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should run federated query: getDocumentEtcById', async () =>
    createTestClient(server)
      .query({
        query: DOCUMENT_ETCPO_BY_ID,
        variables: { id: '321321321' }
      })
      .then(({ data }) => expect(data).toMatchSnapshot()));
});
