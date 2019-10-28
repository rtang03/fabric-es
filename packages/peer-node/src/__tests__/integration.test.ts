require('dotenv').config();
import {
  Document,
  DocumentEvent,
  reduceToDocument,
  reduceToTrade,
  reduceToUser,
  Trade,
  TradeEvent,
  User,
  UserEvent
} from '@espresso/common';
import { createPeer, getNetwork, Peer } from '@espresso/fabric-cqrs';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import { omit, pick } from 'lodash';
import {
  CREATE_DOCUMENT,
  DOCUMENT_ETCPO_BY_ID,
  resolvers as docResolvers,
  typeDefs as docTypeDefs
} from '../document';
import {
  CREATE_ETCPO,
  EtcPo,
  ETCPO_BY_ID,
  EtcPoEvent,
  reduceToEtcPo,
  resolvers as privatedataResolvers,
  typeDefs as privatedataTypeDefs
} from '../privatedata';
import {
  CREATE_TRADE,
  resolvers as tradeResolvers,
  typeDefs as tradeTypeDefs
} from '../trade';
import {
  CREATE_USER,
  PAGINATED_USER,
  USER_BY_ID,
  USER_COMMITS,
  USERS
} from '../user';
import { constructTestServer, getApolloServer } from './__utils__';

let server;
let docPeer: Peer;
let tradePeer: Peer;
let privatePeer: Peer;
let documentService: ApolloServer;
let tradeService: ApolloServer;
let privatedataService: ApolloServer;
let docNetworkConfig;
let tradeNetworkConfig;
let privateNetworkConfig;
const collection = 'Org1PrivateDetails';
const prefix = 'int_test_';

beforeAll(async () => {
  // Document Service

  const enrollmentId = '';
  docNetworkConfig = await getNetwork({ enrollmentId });
  docPeer = createPeer({
    ...docNetworkConfig,
    collection,
    reducer: reduceToDocument
  });
  await docPeer.subscribeHub();
  documentService = getApolloServer({
    typeDefs: docTypeDefs,
    resolvers: docResolvers,
    dataSources: () => ({
      docDataSource: {
        repo: docPeer.getRepository<Document, DocumentEvent>({
          entityName: prefix + 'document',
          reducer: reduceToDocument
        })
      },
      userDataSource: {
        repo: docPeer.getRepository<User, UserEvent>({
          entityName: prefix + 'user',
          reducer: reduceToUser
        })
      },
      tradeDataSource: {
        repo: docPeer.getRepository<Trade, TradeEvent>({
          entityName: prefix + 'trade',
          reducer: reduceToTrade
        })
      }
    })
  });
  await documentService.listen({ port: 14001 });

  // Trade Service
  // todo: bug
  tradeNetworkConfig = await getNetwork({ enrollmentId: null });
  tradePeer = createPeer({
    ...tradeNetworkConfig,
    collection,
    reducer: reduceToDocument
  });
  await tradePeer.subscribeHub();
  tradeService = getApolloServer({
    typeDefs: tradeTypeDefs,
    resolvers: tradeResolvers,
    dataSources: () => ({
      userDataSource: {
        repo: tradePeer.getRepository<User, UserEvent>({
          entityName: prefix + 'user',
          reducer: reduceToUser
        })
      },
      tradeDataSource: {
        repo: tradePeer.getRepository<Trade, TradeEvent>({
          entityName: prefix + 'trade',
          reducer: reduceToTrade
        })
      }
    })
  });
  await tradeService.listen({ port: 14002 });

  // Privatedata Service
  privateNetworkConfig = await getNetwork({ enrollmentId });
  privatePeer = createPeer({
    ...privateNetworkConfig,
    collection,
    reducer: reduceToEtcPo
  });
  privatedataService = getApolloServer({
    typeDefs: privatedataTypeDefs,
    resolvers: privatedataResolvers,
    dataSources: () => ({
      etcDataSource: {
        privatedataRepo: privatePeer.getPrivateDataRepo<EtcPo, EtcPoEvent>({
          entityName: prefix + 'etcPo',
          reducer: reduceToEtcPo
        })
      }
    })
  });
  await privatedataService.listen({ port: 14003 });

  server = await constructTestServer();
});

afterAll(async () => {
  docPeer.unsubscribeHub();
  tradePeer.unsubscribeHub();
  docPeer.disconnect();
  tradePeer.disconnect();
  privatePeer.disconnect();
  await documentService.stop();
  await tradeService.stop();
  await privatedataService.stop();
  await server.stop();
});

let commitId: string;

describe('User Entity: Integration Test', () => {
  it('should create user', async () =>
    createTestClient(server)
      .query({
        query: CREATE_USER,
        variables: {
          name: 'Create Test User',
          userId: 'test@gmail.com'
        }
      })
      .then(({ data: { createUser } }) => {
        commitId = createUser.commitId;
        expect(pick(createUser, 'id', 'entityName')).toMatchSnapshot();
      }));

  it('should run QUERIES', done =>
    setTimeout(async () => {
      await createTestClient(server)
        .query({ query: USERS })
        .then(({ data }) => expect(data).toMatchSnapshot());

      await createTestClient(server)
        .query({
          query: PAGINATED_USER,
          variables: { cursor: 10 }
        })
        .then(({ data }) => expect(data).toMatchSnapshot());

      await createTestClient(server)
        .query({
          query: USER_BY_ID,
          variables: { id: 'test@gmail.com' }
        })
        .then(({ data }) => expect(data).toMatchSnapshot());

      await createTestClient(server)
        .query({
          query: USER_COMMITS,
          variables: { id: 'test@gmail.com' }
        })
        .then(({ data: { getCommitByUserId } }) => getCommitByUserId)
        .then(commits => omit(commits[0], 'commitId', 'committedAt'))
        .then(result => expect(result).toMatchSnapshot());

      done();
    }, 5000));
});

describe('Trade Entity: Integration Test', () => {
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
      .then(({ data: { createTrade } }) => createTrade)
      .then(commit => pick(commit, 'id', 'entityName', 'version'))
      .then(result => expect(result).toMatchSnapshot()));
});

describe('Document Entity: Integration Test', () => {
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
      .then(({ data: { createDocument } }) => createDocument)
      .then(commit => pick(commit, 'id', 'entityName', 'version'))
      .then(result => expect(result).toMatchSnapshot()));
});

describe('Etc Privatedata: Integration Test', () => {
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
      .then(({ data: { createEtcPo } }) => createEtcPo)
      .then(commit => pick(commit, 'id', 'entityName', 'version'))
      .then(result => expect(result).toMatchSnapshot()));

  it('should query: getEtcPoById', async () =>
    createTestClient(server)
      .query({ query: ETCPO_BY_ID, variables: { id: '321321321' } })
      .then(({ data }) => expect(data).toMatchSnapshot()));

  it('should run federated query: getDocumentEtcById', async () =>
    createTestClient(server)
      .query({ query: DOCUMENT_ETCPO_BY_ID, variables: { id: '321321321' } })
      .then(({ data }) => expect(data).toMatchSnapshot()));
});
