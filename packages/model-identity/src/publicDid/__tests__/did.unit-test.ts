import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getMockRepository, getReducer } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import type { ServiceEndpoint } from 'did-resolver';
import gql from 'graphql-tag';
import pick from 'lodash/pick';
import type { DidDocument } from '../../types';
import { createDidDocument, createKeyPair, waitForSecond } from '../../utils';
import {
  ADD_SERVICE_ENDPOINT,
  ADD_VERIFICATION_METHOD,
  CREATE_DIDDOC_WITH_KEYGEN,
  CREATE_DIDDOCUMENT,
  didDocumentReducer,
  didDocumentResolvers as resolvers,
  didDocumentTypeDefs as typeDefs,
  RESOLVE_DIDDOCUMENT,
} from '../index';
import type { DidDocumentEvents } from '../types';

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
let did_KeyGen: string;
let privateKey_KeyGen: string;
let publicKeyHex_KeyGen: string;

beforeAll(async () => {
  server = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs, resolvers }]),
    dataSources: () => ({ didDocument: new DataSrc({ repo }) }),
    context: () => ({ user_id: 'admin' }),
  });
});

afterAll(async () => waitForSecond(2));

describe('Did Unit Test', () => {
  it('should gen key', async () => {
    const service: ServiceEndpoint[] = [
      { id, type: 'LinkedDomains', serviceEndpoint: 'https://bar.example.com' },
    ];
    const didDocument = createDidDocument({ id, service, controllerKey: publicKeyHex });
    expect(didDocument.id).toEqual(`did:fab:${id}`);
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

  // {
  //   did: 'did:fab:0x5b61e5b1b0c9c89f1b2e5579a9ea807f98b0286a',
  //   publicKeyHex: '0406ab0c769553340f9c9f27f12fddc2eec7a8150564b34ef5b783c71d7c7dd16dd983555fc02648c815e6bfaa12539f6b5eb9a4d3ab68d300b0ac562191412531',
  //   privateKey: '7ed1bbaa78bc0a89d248491509ed50b6bee278d70c5b921293980fabafd00c10',
  //   commit: {
  //     id: 'did:fab:0x5b61e5b1b0c9c89f1b2e5579a9ea807f98b0286a',
  //     entityName: 'didDocument',
  //     commitId: '20210313162438583',
  //     version: 0,
  //     entityId: 'did:fab:0x5b61e5b1b0c9c89f1b2e5579a9ea807f98b0286a'
  //   }
  // }
  it('should createDidWithKeyGen', async () =>
    createTestClient(server)
      .mutate({ mutation: gql(CREATE_DIDDOC_WITH_KEYGEN) })
      .then(({ data, errors }) => {
        did_KeyGen = data?.createDidDocWithKeyGen.did;
        privateKey_KeyGen = data?.createDidDocWithKeyGen.privateKey;
        publicKeyHex_KeyGen = data?.createDidDocWithKeyGen.publicKeyHex;
        expect(data?.createDidDocWithKeyGen?.did).toBeDefined();
        expect(data?.createDidDocWithKeyGen?.publicKeyHex).toBeDefined();
        expect(data?.createDidDocWithKeyGen?.privateKey).toBeDefined();
        expect(errors).toBeUndefined();
      }));

  it('should addVerificationMethod', async () =>
    createTestClient(server)
      .mutate({
        mutation: gql(ADD_VERIFICATION_METHOD),
        variables: {
          did: did_KeyGen,
          id: `${did_KeyGen}#key-1`,
          publicKeyHex: '/* public key */',
          controller: did_KeyGen,
        },
      })
      .then(({ data, errors }) => {
        expect(data?.addVerificationMethod.id).toEqual(did_KeyGen);
        expect(data?.addVerificationMethod.version).toEqual(1);
        expect(errors).toBeUndefined();
      }));

  it('should addServiceEndpoint', async () =>
    createTestClient(server)
      .mutate({
        mutation: gql(ADD_SERVICE_ENDPOINT),
        variables: {
          did: did_KeyGen,
          id: `${did_KeyGen}#vcr`,
          typ: 'CredentialRepositoryService',
          serviceEndpoint: 'https://repository.example.com/service/8377464',
        },
      })
      .then(({ data, errors }) => {
        expect(data?.addServiceEndpoint.id).toEqual(did_KeyGen);
        expect(data?.addServiceEndpoint.version).toEqual(2);
        expect(errors).toBeUndefined();
      }));
  // TODO: more tests to add later.
});
