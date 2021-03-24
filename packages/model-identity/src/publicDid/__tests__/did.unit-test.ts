import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getMockRepository, getReducer, Lifecycle } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import DidJWT, { Signer } from 'did-jwt';
import type { ServiceEndpoint } from 'did-resolver';
import gql from 'graphql-tag';
import pick from 'lodash/pick';
import type { DidDocument } from '../../types';
import {
  addressToDid,
  createDidDocument,
  createKeyPair,
  createServiceEndpoint,
  createVerificationMethod,
  waitForSecond,
} from '../../utils';
import {
  ADD_SERVICE_ENDPOINT,
  ADD_VERIFICATION_METHOD,
  CREATE_DIDDOC_WITH_KEYGEN,
  didDocumentReducer,
  didDocumentResolvers as resolvers,
  didDocumentTypeDefs as typeDefs,
  RESOLVE_DIDDOCUMENT,
  CREATE_DIDDOCUMENT,
} from '../index';
import type { DidDocumentEvents } from '../types';

const mockdb: Record<string, Commit> = {};
const repo = getMockRepository<DidDocument, DidDocumentEvents>(
  mockdb,
  'didDocument',
  getReducer<DidDocument, DidDocumentEvents>(didDocumentReducer)
);
const { address, publicKey: publicKeyHex, privateKey } = createKeyPair();
const id = address;
const signer: Signer = DidJWT.ES256KSigner(privateKey);

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

  it('should create DidDocument by signedRequest', async () => {
    const payload = createDidDocument({ id, controllerKey: publicKeyHex });
    const signedRequest = await DidJWT.createJWT(
      {
        aud: addressToDid(id),
        exp: 1957463421,
        entityName: 'didDocument',
        entityId: id,
        version: 0,
        events: [{ type: 'DidDocumentCreated', lifeCycle: Lifecycle.BEGIN, payload }],
      },
      { issuer: addressToDid(id), signer },
      { alg: 'ES256K' }
    );

    return createTestClient(server)
      .mutate({
        mutation: gql(CREATE_DIDDOCUMENT),
        variables: { did: id, signedRequest },
      })
      .then(({ data, errors }) => {
        const commit = data?.createDidDocument;
        expect(commit?.entityName).toEqual('didDocument');
        expect(commit?.version).toEqual(0);
        expect(errors).toBeUndefined();
      });
  });

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

  // data returns
  // {
  //   did: 'did:fab:0x9837133caf33fe5ddaaba13bd00c40a030ba5e07',
  //   publicKeyHex:
  //     '0414577d972fb4dd7d6656be5a9f095f6fb5d9c377f3e318356ff80f0ee46dc02203bdd8971af420cba8a897acb8c51d4cdcdfb7560cbab64bfde83f26795f92a7',
  //   privateKey: 'd84dd7b33898bcb4cd8dbb29ea877baf62962ba98592585f505ce69c15d9594f',
  //   commit: {
  //     id: 'did:fab:0x9837133caf33fe5ddaaba13bd00c40a030ba5e07',
  //     entityName: 'didDocument',
  //     commitId: '20210321133330490',
  //     version: 0,
  //     entityId: 'did:fab:0x9837133caf33fe5ddaaba13bd00c40a030ba5e07',
  //   },
  // };
  // notice that both "events" and "signedRequest" are omitted.
  it('should createDidWithKeyGen', async () =>
    createTestClient(server)
      .mutate({ mutation: gql(CREATE_DIDDOC_WITH_KEYGEN), variables: { signedRequest: '123' } })
      .then(({ data, errors }) => {
        did_KeyGen = data?.createDidDocWithKeyGen.did;
        privateKey_KeyGen = data?.createDidDocWithKeyGen.privateKey;
        publicKeyHex_KeyGen = data?.createDidDocWithKeyGen.publicKeyHex;
        expect(data?.createDidDocWithKeyGen?.did).toBeDefined();
        expect(data?.createDidDocWithKeyGen?.publicKeyHex).toBeDefined();
        expect(data?.createDidDocWithKeyGen?.privateKey).toBeDefined();
        expect(errors).toBeUndefined();
      }));

  // addVerificationMethod: {
  //   id: 'did:fab:0x7b325c08bc6fbc94d863ddab9bff9240393892f3',
  //   entityName: 'didDocument',
  //   version: 1,
  //   commitId: '20210321154634140',
  //   entityId: 'did:fab:0x7b325c08bc6fbc94d863ddab9bff9240393892f3'
  // }
  it('should addVerificationMethod', async () => {
    const payload = createVerificationMethod({
      id: `${did_KeyGen}#key-1`,
      controller: did_KeyGen,
      publicKeyHex: '---public key---',
    });
    const newSigner = DidJWT.ES256KSigner(privateKey_KeyGen);
    const signedRequest = await DidJWT.createJWT(
      {
        aud: did_KeyGen,
        entityName: 'didDocument',
        entityId: did_KeyGen,
        version: 1, // this is used as nonce
        events: [{ type: 'VerificationMethodAdded', payload }],
      },
      { issuer: did_KeyGen, signer: newSigner },
      { alg: 'ES256K' }
    );

    return createTestClient(server)
      .mutate({
        mutation: gql(ADD_VERIFICATION_METHOD),
        variables: { did: did_KeyGen, signedRequest },
      })
      .then(({ data, errors }) => {
        expect(data?.addVerificationMethod.id).toEqual(did_KeyGen);
        expect(data?.addVerificationMethod.version).toEqual(1);
        expect(errors).toBeUndefined();
      });
  });

  it('should addServiceEndpoint', async () => {
    const payload = createServiceEndpoint({
      id: `${did_KeyGen}#vcr`,
      type: 'CredentialRepositoryService',
      serviceEndpoint: 'https://repository.example.com/service/8377464',
    });
    const newSigner = DidJWT.ES256KSigner(privateKey_KeyGen);
    const signedRequest = await DidJWT.createJWT(
      {
        aud: did_KeyGen,
        entityName: 'didDocument',
        entityId: did_KeyGen,
        version: 2,
        events: [{ type: 'ServiceEndpointAdded', payload }],
      },
      { issuer: did_KeyGen, signer: newSigner },
      { alg: 'ES256K' }
    );

    return createTestClient(server)
      .mutate({
        mutation: gql(ADD_SERVICE_ENDPOINT),
        variables: { did: did_KeyGen, signedRequest },
      })
      .then(({ data, errors }) => {
        expect(data?.addServiceEndpoint.id).toEqual(did_KeyGen);
        expect(data?.addServiceEndpoint.version).toEqual(2);
        expect(errors).toBeUndefined();
      });
  });
});
