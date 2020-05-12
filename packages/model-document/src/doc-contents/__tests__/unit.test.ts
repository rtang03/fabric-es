import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getPrivatedataMockRepository, getReducer, PrivatedataRepository } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import {
  CREATE_DOC_CONTENTS,
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  docContentsResolvers,
  docContentsTypeDefs,
  UPDATE_DOC_CONTENTS
} from '..';

const GET_CONTENTS_BY_ID = gql`
  query GetDocContentsById($documentId: String!) {
    getDocContentsById(documentId: $documentId) {
      documentId
      content {
        ... on Data {
          body
        }
        ... on File {
          format
          link
        }
      }
    }
  }
`;

const userId = 'unitTestUser';
const mockdb: Record<string, Commit> = {};
const docContentsRepo: PrivatedataRepository = getPrivatedataMockRepository<DocContents, DocContentsEvents>(
  mockdb,
  'docContents',
  getReducer<DocContents, DocContentsEvents>(docContentsReducer)
);

let service;

beforeAll(async () => {
  service = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs: docContentsTypeDefs, resolvers: docContentsResolvers }]),
    dataSources: () => ({
      docContents: new DataSrc({ repo: docContentsRepo })
    }),
    context: () => ({ user_id: 'admin' })
  });
});

afterAll(
  async () =>
    new Promise(done =>
      setTimeout(() => {
        console.log('DocContents Unit Test - Resolver Finished');
        done();
      }, 500)
    )
);

describe('DocContents Unit Test - Resolver', () => {
  it('create docContents 0', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D0000',
          content: {
            body: '{ "message": "Document Contents 0" }'
          }
        }
      })
      .then(({ data }) => expect(data.createDocContents.id).toEqual('D0000'))
      .catch(_ => expect(false).toBeTruthy()));

  it('create docContents 1', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D0001',
          content: {
            format: 'PDF',
            link: 'http://fake.it/docs/unitTestDocContents-1.pdf'
          }
        }
      })
      .then(({ data }) => expect(data.createDocContents.id).toEqual('D0001'))
      .catch(_ => expect(false).toBeTruthy()));

  it('create docContents 2', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D0002',
          content: {
            body: '{ "message": "Document Contents 2" }'
          }
        }
      })
      .then(({ data }) => expect(data.createDocContents.id).toEqual('D0002'))
      .catch(_ => expect(false).toBeTruthy()));

  // TODO: Implement lifecycle event attribute to prevent creating same entity more than once
  // NOTE: This 'create docContents' call should return normal, but querying 'L0000' should return the original result instead of the changed values
  it('create docContents 0 again', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D0000',
          content: {
            body: '{ "message": "Document Contents 0VERWRITTEN" }'
          }
        }
      })
      .then(({ data }) => expect(data.createDocContents.id).toEqual('D0000'))
      .catch(_ => expect(false).toBeTruthy()));

  it('update docContents 1', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D0001',
          content: {
            format: 'JPEG',
            link: 'http://fake.it/docs/unitTestDocContents-1.jpg'
          }
        }
      })
      .then(({ data }) => expect(data.updateDocContents.id).toEqual('D0001'))
      .catch(_ => expect(false).toBeTruthy()));

  it('update docContents 2', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D0002',
          content: {
            body: '{ "message": "Document Contents 2 EDITED" }'
          }
        }
      })
      .then(({ data }) => expect(data.updateDocContents.id).toEqual('D0002'))
      .catch(_ => expect(false).toBeTruthy()));

  it('change content type of docContents 1', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D0001',
          content: {
            body: '{ "message": "Document Contents 1!!!!!" }'
          }
        }
      })
      .then(({ errors }) =>
        expect(
          errors.reduce((acc, cur) => (cur.message.includes('DOC_CONTENTS_MISMATCHED') ? cur.message : acc), '')
        ).toContain('DOC_CONTENTS_MISMATCHED')
      )
      .catch(_ => expect(false).toBeTruthy()));

  it('create docContents with empty content', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D9999',
          content: {}
        }
      })
      .then(({ errors }) =>
        expect(
          errors.reduce((acc, cur) => (cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc), '')
        ).toContain('REQUIRED_DATA_MISSING')
      )
      .catch(_ => expect(false).toBeTruthy()));

  it('update docContents 2 with empty content', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D0002',
          content: {}
        }
      })
      .then(({ errors }) =>
        expect(
          errors.reduce((acc, cur) => (cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc), '')
        ).toContain('REQUIRED_DATA_MISSING')
      )
      .catch(_ => expect(false).toBeTruthy()));

  it('update an non-existing docContents', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOC_CONTENTS,
        variables: {
          userId,
          documentId: 'D9999',
          content: { body: 'Hello' }
        }
      })
      .then(({ errors }) =>
        expect(
          errors.reduce((acc, cur) => (cur.message.includes('DOC_CONTENTS_NOT_FOUND') ? cur.message : acc), '')
        ).toContain('DOC_CONTENTS_NOT_FOUND')
      )
      .catch(_ => expect(false).toBeTruthy()));

  it('query docContents 0 by id', async () =>
    createTestClient(service)
      .query({
        query: GET_CONTENTS_BY_ID,
        variables: { documentId: 'D0000' }
      })
      .then(({ data }) => expect(data.getDocContentsById).toMatchSnapshot())
      .catch(_ => expect(false).toBeTruthy()));

  it('query docContents 1 by id', async () =>
    createTestClient(service)
      .query({
        query: GET_CONTENTS_BY_ID,
        variables: { documentId: 'D0001' }
      })
      .then(({ data }) => expect(data.getDocContentsById).toMatchSnapshot())
      .catch(_ => expect(false).toBeTruthy()));

  it('query docContents 2 by id', async () =>
    createTestClient(service)
      .query({
        query: GET_CONTENTS_BY_ID,
        variables: { documentId: 'D0002' }
      })
      .then(({ data }) => expect(data.getDocContentsById).toMatchSnapshot())
      .catch(_ => expect(false).toBeTruthy()));
});
