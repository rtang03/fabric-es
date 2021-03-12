import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getMockRepository, getReducer } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import type { VerificationMethod, ServiceEndpoint } from 'did-resolver';
import gql from 'graphql-tag';
import pick from 'lodash/pick';
import { createDidDocument, createKeyPair, waitForSecond } from '../../utils';
import {
  CREATE_DIDDOCUMENT,
  didDocumentReducer,
  didDocumentResolvers as resolvers,
  didDocumentTypeDefs as typeDefs,
  RESOLVE_DIDDOCUMENT,
} from '../index';
import type { DidDocument, DidDocumentEvents } from '../types';

const mockdb: Record<string, Commit> = {};
const repo = getMockRepository<DidDocument, DidDocumentEvents>(
  mockdb,
  'didDocument',
  getReducer<DidDocument, DidDocumentEvents>(didDocumentReducer)
);
const { address, publicKey: publicKeyHex } = createKeyPair();
const id = address;

repo.fullTextSearchEntity = jest.fn();

let server: ApolloServer;

beforeAll(async () => {
  server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    dataSources: () => ({ didDocument: new DataSrc({ repo }) }),
    context: () => ({ user_id: 'admin' }),
  });
});

afterAll(async () => {
  return waitForSecond(2);
});

describe('Did Unit Test', () => {
  it('should gen key', async () => {
    const service: ServiceEndpoint[] = [
      { id, type: 'LinkedDomains', serviceEndpoint: 'https://bar.example.com' },
    ];
    const didDocument = createDidDocument({ id, service, controllerKey: publicKeyHex });
    expect(didDocument.id).toEqual(id);
  });

  it('should create', async () =>
    createTestClient(server)
      .mutate({ mutation: gql(CREATE_DIDDOCUMENT), variables: { did: id, publicKeyHex } })
      .then(({ data }) => {
        const did = data?.createDidDocument;
        expect(did?.entityName).toEqual('didDocument');
      }));

  it('should resolve', async () => {
    repo.fullTextSearchEntity = jest.fn().mockResolvedValueOnce({
      status: 'OK',
      data: {
        total: 1,
        hasMore: false,
        items: [
          {
            context: 'https://www.w3.org/ns/did/v1',
            id: '0x5490b3081697c8d8ae324bb0e46a019614994006',
            controller: '0x5490b3081697c8d8ae324bb0e46a019614994006',
            verificationMethod: [
              {
                id: '0x5490b3081697c8d8ae324bb0e46a019614994006',
                type: 'Secp256k1VerificationKey2018',
                controller: '0x5490b3081697c8d8ae324bb0e46a019614994006',
                publicKeyHex:
                  '0420236e2aed10bd9afd2d7a3404fed01486df3047621eeb10de4ff741179bacec1d329dd113cd825676c9446d2656d1db21df891566918570b9ac96b4d0f673a4',
              },
            ],
            service: undefined,
            created: '2021-03-03T08:30:55.196Z',
            updated: '2021-03-03T08:30:55.196Z',
            proof: undefined,
            keyAgreement: undefined,
          },
        ],
      },
    });

    return createTestClient(server)
      .query({ query: gql(RESOLVE_DIDDOCUMENT), variables: { did: id } })
      .then(({ data, errors }) => {
        expect(pick(data?.resolveDidDocument, 'context', 'id', 'controller')).toEqual({
          context: 'https://www.w3.org/ns/did/v1',
          id: '0x5490b3081697c8d8ae324bb0e46a019614994006',
          controller: '0x5490b3081697c8d8ae324bb0e46a019614994006',
        });
        expect(errors).toBeUndefined();
      });
  });
});
