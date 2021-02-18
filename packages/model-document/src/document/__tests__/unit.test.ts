import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getMockRepository, getReducer } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import {
  CREATE_DOCUMENT,
  DELETE_DOCUMENT,
  documentReducer,
  documentResolvers,
  documentTypeDefs,
  RESTRICT_DOCUMENT_ACCESS,
  UPDATE_DOCUMENT,
} from '..';
import type { Document, DocumentEvents } from '../types';

const GET_BY_ID = gql`
  query GetDocumentById($documentId: String!) {
    getDocumentById(documentId: $documentId) {
      documentId
      ownerId
      loanId
      title
      reference
      status
    }
  }
`;
const GET_DOCUMENT_BY_PAGE = gql`
  query GetDocumentsByPage($pageSize: Int) {
    getPaginatedDocuments(pageSize: $pageSize) {
      total
      hasMore
      items {
        documentId
        ownerId
        loanId
        title
        reference
        status
      }
    }
  }
`;

const userId = 'unitTestUser';
const loanId = 'L0001';
const mockdb: Record<string, Commit> = {};
const docuRepo = getMockRepository<Document, DocumentEvents>(
  mockdb,
  'document',
  getReducer<Document, DocumentEvents>(documentReducer)
);
docuRepo.fullTextSearchEntity = jest.fn();

let service;

beforeAll(async () => {
  service = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs: documentTypeDefs, resolvers: documentResolvers }]),
    dataSources: () => ({
      document: new DataSrc({ repo: docuRepo }),
    }),
    context: () => ({ user_id: 'admin' }),
  });
});

afterAll(
  async () =>
    new Promise<void>((ok) =>
      setTimeout(() => {
        console.log('Document Unit Test - Resolver Finished');
        ok();
      }, 500)
    )
);

describe('Document Unit Test - Resolver', () => {
  it('create document 0', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0000',
          loanId,
          title: 'Unit test document 0',
          reference: 'REF-UNIT-TEST-DOC-0',
        },
      })
      .then(({ data }) => expect(data.createDocument.id).toEqual('D0000')));

  it('create document 1', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0001',
          loanId,
          title: 'Unit test document 1',
          reference: 'REF-UNIT-TEST-DOC-1',
        },
      })
      .then(({ data }) => expect(data.createDocument.id).toEqual('D0001')));

  it('create document 2', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0002',
          title: 'Unit test document 2',
          reference: 'REF-UNIT-TEST-DOC-2',
        },
      })
      .then(({ data }) => expect(data.createDocument.id).toEqual('D0002')));

  it('create document 3', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0003',
          loanId,
          title: 'Unit test document 3',
          reference: 'REF-UNIT-TEST-DOC-3',
        },
      })
      .then(({ data }) => expect(data.createDocument.id).toEqual('D0003')));

  it('create document 4', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0004',
          loanId,
          title: 'Unit test document 4',
          reference: 'REF-UNIT-TEST-DOC-4',
        },
      })
      .then(({ data }) => expect(data.createDocument.id).toEqual('D0004')));

  it('create document 5', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0005',
          loanId,
          title: 'Unit test document 5',
          reference: 'REF-UNIT-TEST-DOC-5',
        },
      })
      .then(({ data }) => expect(data.createDocument.id).toEqual('D0005')));

  // TODO: Implement lifecycle event attribute to prevent creating same entity more than once
  // NOTE: This 'create document' call should return normal, but querying 'D0000' should return the original result instead of the changed values
  it('create document 0 again', async () =>
    createTestClient(service)
      .mutate({
        mutation: CREATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0000',
          loanId,
          title: 'Unit test document 0VERWRITTEN',
          reference: 'REF-UNIT-TEST-DOC-0VERWRITTEN',
        },
      })
      .then(({ data }) => expect(data.createDocument.id).toEqual('D0000')));

  it('update document 1', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0001',
          title: 'Unit test document 1 EDITED',
        },
      })
      .then(({ data }) =>
        expect(data.updateDocument.map((d) => (d && d.id ? d.id : ''))).toContain('D0001')
      ));

  it('associate document 2 to a loan', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0002',
          loanId,
        },
      })
      .then(({ data }) => expect(data.updateDocument.map((d) => d?.id || '')).toContain('D0002')));

  it('update document 3', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0003',
          loanId: 'L0000',
          title: 'Unit test document 3 EDITED',
        },
      })
      .then(({ data }) => expect(data.updateDocument.map((d) => d?.id || '')).toContain('D0003')));

  it('update a readonly field of document 4', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0004',
          reference: 'REF-UNIT-TEST-DOC-9',
        },
      })
      .then(({ errors }) =>
        expect(
          errors.reduce(
            (acc, cur) => (cur.message.includes('INVALID_OPERATION') ? cur.message : acc),
            ''
          )
        ).toContain('INVALID_OPERATION')
      ));

  it('update document 5 with both successful and fail cases', async () =>
    createTestClient(service)
      .mutate({
        mutation: UPDATE_DOCUMENT,
        variables: {
          userId,
          documentId: 'D0005',
          reference: 'REF-UNIT-TEST-DOC-9',
          title: 'Unit test document 5 EDITED',
        },
      })
      .then(({ data, errors }) => {
        expect(errors.map((e) => e.message)).toContain('Error: INVALID_OPERATION');
        expect(data.updateDocument.map((d) => d?.id || '')).toContain('D0005');
      }));

  it('delete document 4', async () =>
    createTestClient(service)
      .mutate({
        mutation: DELETE_DOCUMENT,
        variables: { userId, documentId: 'D0004' },
      })
      .then(({ data }) => expect(data.deleteDocument.id).toEqual('D0004')));

  it('change status of document 5', async () =>
    createTestClient(service)
      .mutate({
        mutation: RESTRICT_DOCUMENT_ACCESS,
        variables: { userId, documentId: 'D0005' },
      })
      .then(({ data }) => expect(data.restrictAccess.id).toEqual('D0005')));

  it('query loan 0 by id', async () => {
    docuRepo.fullTextSearchEntity = jest.fn().mockResolvedValueOnce({
      status: 'OK',
      data: {
        total: 1,
        hasMore: false,
        cursor: 1,
        items: [
          {
            documentId: 'D0000',
            loanId: 'L0001',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-0VERWRITTEN',
            status: 0,
            title: 'Unit test document 0VERWRITTEN',
          },
        ],
      },
    });

    return createTestClient(service)
      .query({
        query: GET_BY_ID,
        variables: { documentId: 'D0000' },
      })
      .then(({ data }) => expect(data.getDocumentById).toMatchSnapshot());
  });

  it('query loan 1 by id', async () => {
    docuRepo.fullTextSearchEntity = jest.fn().mockResolvedValueOnce({
      status: 'OK',
      data: {
        total: 1,
        hasMore: false,
        cursor: 1,
        items: [
          {
            documentId: 'D0001',
            loanId: 'L0001',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-1',
            status: 0,
            title: 'Unit test document 1 EDITED',
          },
        ],
      },
    });

    return createTestClient(service)
      .query({
        query: GET_BY_ID,
        variables: { documentId: 'D0001' },
      })
      .then(({ data }) => expect(data.getDocumentById).toMatchSnapshot());
  });

  it('query loan 2 by id', async () => {
    docuRepo.fullTextSearchEntity = jest.fn().mockResolvedValueOnce({
      status: 'OK',
      data: {
        total: 1,
        hasMore: false,
        cursor: 1,
        items: [
          {
            documentId: 'D0002',
            loanId: 'L0001',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-2',
            status: 0,
            title: 'Unit test document 2',
          },
        ],
      },
    });

    return createTestClient(service)
      .query({
        query: GET_BY_ID,
        variables: { documentId: 'D0002' },
      })
      .then(({ data }) => expect(data.getDocumentById).toMatchSnapshot());
  });

  it('query documents by page', async () => {
    docuRepo.fullTextSearchEntity = jest.fn().mockResolvedValueOnce({
      status: 'OK',
      data: {
        total: 6,
        hasMore: false,
        items: [
          {
            documentId: 'D0000',
            loanId: 'L0001',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-0VERWRITTEN',
            status: 0,
            title: 'Unit test document 0VERWRITTEN',
          },
          {
            documentId: 'D0001',
            loanId: 'L0001',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-1',
            status: 0,
            title: 'Unit test document 1 EDITED',
          },
          {
            documentId: 'D0002',
            loanId: 'L0001',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-2',
            status: 0,
            title: 'Unit test document 2',
          },
          {
            documentId: 'D0003',
            loanId: 'L0000',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-3',
            status: 0,
            title: 'Unit test document 3 EDITED',
          },
          {
            documentId: 'D0004',
            loanId: 'L0001',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-4',
            status: 1,
            title: 'Unit test document 4',
          },
          {
            documentId: 'D0005',
            loanId: 'L0001',
            ownerId: 'unitTestUser',
            reference: 'REF-UNIT-TEST-DOC-5',
            status: 2,
            title: 'Unit test document 5 EDITED',
          },
        ],
      },
    });

    return createTestClient(service)
      .query({
        query: GET_DOCUMENT_BY_PAGE,
      })
      .then(({ data }) => expect(data.getPaginatedDocuments).toMatchSnapshot());
  });
});
