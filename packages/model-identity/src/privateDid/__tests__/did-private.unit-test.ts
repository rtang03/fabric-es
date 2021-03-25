import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getPrivateMockRepository, getReducer } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import { addressToDid, createKeyPair, waitForSecond } from '../../utils';
import { privateDidDocReducer } from '../domain';
import {
  ADD_SERVICE_ENDPOINT,
  ADD_VERIFICATION_METHOD,
  CREATE_DIDDOC_WITH_KEYGEN,
  CREATE_PRIVATE_DIDDOCUMENT,
  privateDidDocResolvers,
  privateDidDocTypeDefs,
  RESOLVE_DIDDOCUMENT,
} from '../index';
import type { PrivateDidDocument, PrivateDidDocEvents } from '../types';

const mockdb: Record<string, Commit> = {};
const repo = getPrivateMockRepository<PrivateDidDocument, PrivateDidDocEvents>(
  mockdb,
  'privateDidDocument',
  getReducer<PrivateDidDocument, PrivateDidDocEvents>(privateDidDocReducer)
);
const { address, publicKey: publicKeyHex } = createKeyPair();
const id = address;

let server: ApolloServer;
let did_KeyGen: string;
let privateKey_KeyGen: string;
let publicKeyHex_KeyGen: string;

beforeAll(async () => {
  server = new ApolloServer({
    schema: buildFederatedSchema([
      { typeDefs: privateDidDocTypeDefs, resolvers: privateDidDocResolvers },
    ]),
    dataSources: () => ({ privateDidDocument: new DataSrc({ repo }) }),
    context: () => ({ user_id: 'admin' }),
  });
});

afterAll(async () => waitForSecond(2));

describe('Private Did Unit Test', () => {
  it('should create', async () =>
    createTestClient(server)
      .mutate({
        mutation: gql(CREATE_PRIVATE_DIDDOCUMENT),
        variables: { did: id, publicKeyHex },
      })
      .then(({ data, errors }) => {
        const commit = data?.createDidDocumentPrivate;
        expect(commit?.entityName).toEqual('privateDidDocument');
        expect(errors).toBeUndefined();
      }));

  it('should resolve', async () =>
    createTestClient(server)
      .query({ query: gql(RESOLVE_DIDDOCUMENT), variables: { did: id } })
      .then(({ data, errors }) => {
        expect(data?.resolveDidDocumentPrivate.context).toEqual('https://www.w3.org/ns/did/v1');
        expect(data?.resolveDidDocumentPrivate.id).toEqual(addressToDid(address));
        expect(data?.resolveDidDocumentPrivate.controller).toEqual(addressToDid(address));
        expect(errors).toBeUndefined();
      }));

  it('should createDidWithKeyGen', async () =>
    createTestClient(server)
      .mutate({ mutation: gql(CREATE_DIDDOC_WITH_KEYGEN) })
      .then(({ data, errors }) => {
        did_KeyGen = data?.createDidDocWithKeyGenPrivate.did;
        privateKey_KeyGen = data?.createDidDocWithKeyGenPrivate.privateKey;
        publicKeyHex_KeyGen = data?.createDidDocWithKeyGenPrivate.publicKeyHex;
        expect(data?.createDidDocWithKeyGenPrivate?.did).toBeDefined();
        expect(data?.createDidDocWithKeyGenPrivate?.publicKeyHex).toBeDefined();
        expect(data?.createDidDocWithKeyGenPrivate?.privateKey).toBeDefined();
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
        expect(data?.addVerificationMethodPrivate.id).toEqual(did_KeyGen);
        expect(data?.addVerificationMethodPrivate.version).toEqual(1);
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
        expect(data?.addServiceEndpointPrivate.id).toEqual(did_KeyGen);
        expect(data?.addServiceEndpointPrivate.version).toEqual(2);
        expect(errors).toBeUndefined();
      }));
});
