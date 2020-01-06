const { resolve } = require('path');
require('dotenv').config({
  path: resolve(__dirname, './__utils__/.env.test')
});
import { createAuthServer, createDbConnection } from '@espresso/authentication';
import { ApolloError, ApolloServer } from 'apollo-server';
import { Express } from 'express';
import http from 'http';
import fetch from 'node-fetch';
import request from 'supertest';
import { createAdminService } from '../admin';
import {
  MISSING_VARIABLE,
  UNAUTHORIZED_ACCESS,
  USER_NOT_FOUND
} from '../admin/contants';
import {
  CREATE_ROOT_CLIENT,
  GET_BLOCK_BY_NUMBER,
  GET_CA_IDENTITIES,
  GET_CA_IDENTITY_BY_ENROLLMENT_ID,
  GET_CHAIN_HEIGHT,
  GET_CHANNEL_PEERS,
  GET_COLLECTION_CONFIGS,
  GET_INSTALLED_CC_VERSION,
  GET_INSTALLED_CHAINCODES,
  GET_INSTANTIATED_CHAINCODES,
  GET_PEERINFO,
  IS_WALLET_ENTRY_EXIST,
  LIST_WALLET,
  LOGIN,
  REGISTER_ADMIN,
  REGISTER_AND_ENROLL_USER
} from '../admin/query';
import { createGateway } from '../utils/createGateway'; // do not use shorten path

const dbConnection = createDbConnection({
  name: 'default',
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'docker',
  database: 'gw-org1',
  logging: false,
  synchronize: true,
  dropSchema: true
});

let authServer: http.Server;
let federatedAdminServer: ApolloServer;
let app: Express;
let accessToken: string;
let user_id: string;
const authPort = process.env.OAUTH_SERVER_PORT || 3300;
const port = 15000;
const authUri = `http://localhost:${authPort}/graphql`;
const headers = { 'content-type': 'application/json' };
const username = `tester${Math.floor(Math.random() * 10000)}`;
const email = `${username}@example.com`;
const password = 'password';
const admin_password = process.env.ADMIN_PASSWORD || 'admin_test';

type QueryResponse = {
  body: {
    data: any;
    errors: ApolloError[];
  };
};

beforeAll(async () => {
  // step 1: start admin service (federated service)
  federatedAdminServer = await createAdminService();
  await federatedAdminServer.listen({ port });

  // step 2: prepare federated gateway
  app = await createGateway({
    serviceList: [
      {
        name: 'admin',
        url: `http://localhost:${port}/graphql`
      }
    ]
  });

  // step 3: start authentication server (expressjs)
  const auth = await createAuthServer({ dbConnection });
  authServer = http.createServer(auth);
  authServer.listen(authPort);
});

afterAll(async () => {
  authServer.close();
  await federatedAdminServer.stop();
  return new Promise(done => setTimeout(() => done(), 500));
});

// require a running Fabric network
// run service.integration.test in fabric-cqrs, if no pre-existing onchain data
describe('Authenticted Service Admin Int Tests', () => {
  it('should createRootClient', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: { admin: 'admin', password: 'admin_test' }
      })
    })
      .then(res => res.json())
      .then(({ data }) =>
        expect(typeof data?.createRootClient).toEqual('string')
      ));

  it('should register new (admin) user', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'Register',
        query: REGISTER_ADMIN,
        variables: { email, password, username, admin_password }
      })
    })
      .then(res => res.json())
      .then(({ data }) => expect(data?.register).toBeTruthy()));

  it('should login new (admin) user', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'Login',
        query: LOGIN,
        variables: { email, password }
      })
    })
      .then(res => res.json())
      .then(({ data }) => {
        accessToken = data.login.accessToken;
        user_id = data.login.user.id;
        expect(typeof data?.login?.accessToken).toEqual('string');
        expect(data?.login?.ok).toBeTruthy();
      }));

  it('should fail to getBlockByNumber: non-exist block', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetBlockByNumber',
        query: GET_BLOCK_BY_NUMBER,
        variables: { blockNumber: 10000 }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getBlockByNumber).toBeNull();
      }));

  it('should getBlockByNumber', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetBlockByNumber',
        query: GET_BLOCK_BY_NUMBER,
        variables: { blockNumber: 6 }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getBlockByNumber.block_number).toEqual('6');
      }));

  it('should fail to getCaIdentities: without accessToken', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetCaIdentities',
        query: GET_CA_IDENTITIES
      })
      .expect(({ body: { data, errors } }: QueryResponse) => {
        expect(data?.getCaIdentities).toBeNull();
        expect(errors[0].message).toEqual(UNAUTHORIZED_ACCESS);
      }));

  it('should fail to listWallet: without accessToken', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'ListWallet',
        query: LIST_WALLET
      })
      .expect(({ body: { data, errors } }: QueryResponse) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual(UNAUTHORIZED_ACCESS);
      }));

  it('should listWallet: with (admin) accessToken', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'ListWallet',
        query: LIST_WALLET
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(typeof data?.listWallet[0].label).toEqual('string');
        expect(data?.listWallet[0].mspId).toEqual('Org1MSP');
      }));

  it('should fail to isWalletEntryExist: no label', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'IsWalletEntryExist',
        query: IS_WALLET_ENTRY_EXIST
      })
      .expect(({ body: { data, errors } }) => {
        expect(data).toBeUndefined();
        expect(errors[0].message).toEqual(MISSING_VARIABLE);
      }));

  it('should isWalletEntryExist: wrong label', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'IsWalletEntryExist',
        query: IS_WALLET_ENTRY_EXIST,
        variables: { label: 'no such label' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.isWalletEntryExist).toBeFalsy();
      }));

  it('should isWalletEntryExist: right label', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'IsWalletEntryExist',
        query: IS_WALLET_ENTRY_EXIST,
        variables: { label: 'admin' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.isWalletEntryExist).toBeTruthy();
      }));

  it('should getCaIdentities: with (admin) accessToken', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'GetCaIdentities',
        query: GET_CA_IDENTITIES
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getCaIdentities[0].id).toEqual('rca-org1-admin');
      }));

  it('should getChannelPeers', async () =>
    request(app)
      .post('/graphql')
      .send({ operationName: 'GetChannelPeers', query: GET_CHANNEL_PEERS })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getChannelPeers[0]).toEqual({
          name: 'peer0.org1.example.com',
          mspid: 'Org1MSP',
          url: 'grpcs://localhost:7051'
        });
      }));

  it('should getCollectionConfigs', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetCollectionConfigs',
        query: GET_COLLECTION_CONFIGS
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getCollectionConfigs[0].name).toEqual(
          'Org1PrivateDetails'
        );
      }));

  it('should getInstalledChaincodes', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetInstalledChaincodes',
        query: GET_INSTALLED_CHAINCODES
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getInstalledChaincodes[0].name).toEqual('eventstore');
        expect(data?.getInstalledChaincodes[1].name).toEqual('privatedata');
      }));

  it('should getInstantiatedChaincodes', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetInstantiatedChaincodes',
        query: GET_INSTANTIATED_CHAINCODES
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getInstantiatedChaincodes[0].name).toEqual('eventstore');
        expect(data?.getInstantiatedChaincodes[1].name).toEqual('privatedata');
      }));

  it('should fail getInstalledCCVersion: missing chaincode_id', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetInstalledCCVersion',
        query: GET_INSTALLED_CC_VERSION
      })
      .expect(({ body: { data, errors } }) => {
        expect(data).toBeUndefined();
        expect(errors[0].message).toEqual(MISSING_VARIABLE);
      }));

  it('should getInstalledCCVersion', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetInstalledCCVersion',
        query: GET_INSTALLED_CC_VERSION,
        variables: { chaincode_id: 'eventstore' }
      })
      .expect(({ body: { data, errors } }) => {
        if (errors) expect(errors).toBeUndefined();
        expect(data?.getInstalledCCVersion).toEqual('0');
      }));

  it('should getChainHeight', async () =>
    request(app)
      .post('/graphql')
      .send({ operationName: 'GetChainHeight', query: GET_CHAIN_HEIGHT })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(typeof data?.getChainHeight).toEqual('number');
      }));

  it('should getPeerInfo', async () =>
    request(app)
      .post('/graphql')
      .send({ operationName: 'GetPeerInfo', query: GET_PEERINFO })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getPeerInfo).toEqual({
          peerName: 'peer0.org1.example.com',
          mspid: 'Org1MSP'
        });
      }));

  it('should fail to getCaIdentityByEnrollmentId: without accessToken', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetCaIdentityByEnrollmentId',
        query: GET_CA_IDENTITY_BY_ENROLLMENT_ID,
        variables: { enrollmentId: user_id }
      })
      .expect(({ body: { data, errors } }: QueryResponse) => {
        expect(data?.getCaIdentityByEnrollmentId).toBeNull();
        expect(errors[0].message).toEqual(USER_NOT_FOUND);
      }));

  it('should fail to getCaIdentityByEnrollmentId, before registerAndEnroll', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'GetCaIdentityByEnrollmentId',
        query: GET_CA_IDENTITY_BY_ENROLLMENT_ID,
        variables: { enrollmentId: user_id }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getCaIdentityByEnrollmentId).toBeNull();
      }));

  it('should registerAndEnroll', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'RegisterAndEnrollUser',
        query: REGISTER_AND_ENROLL_USER,
        variables: { enrollmentId: user_id, enrollmentSecret: password }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.registerAndEnrollUser).toBeTruthy();
      }));

  it('should getCaIdentityByEnrollmentId, after registerAndEnroll', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'GetCaIdentityByEnrollmentId',
        query: GET_CA_IDENTITY_BY_ENROLLMENT_ID,
        variables: { enrollmentId: user_id }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getCaIdentityByEnrollmentId.id).toEqual(user_id);
      }));
});
