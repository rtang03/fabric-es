require('dotenv').config({
  path: require('path').resolve(__dirname, '../../../.env.test')
});

import { createAuthServer, createDbConnection } from '@espresso/authentication';
import { ApolloError, ApolloServer } from 'apollo-server';
import { Express } from 'express';
import Client from 'fabric-client';
import http from 'http';
import fetch from 'node-fetch';
import request from 'supertest';
import {
  CREATE_ROOT_CLIENT,
  createGateway,
  GET_BLOCK_BY_NUMBER,
  GET_CA_IDENTITIES,
  GET_CA_IDENTITY_BY_ENROLLMENT_ID,
  GET_CHAIN_HEIGHT,
  GET_INSTALLED_CC_VERSION,
  GET_INSTALLED_CHAINCODES,
  GET_INSTANTIATED_CHAINCODES,
  IS_WALLET_ENTRY_EXIST,
  LIST_WALLET,
  logger,
  LOGIN,
  REGISTER_ADMIN,
  REGISTER_AND_ENROLL_USER
} from '../..';
import {
  MISSING_VARIABLE,
  UNAUTHORIZED_ACCESS,
  USER_NOT_FOUND
} from '../constants';
import { createAdminServiceV2 } from '../createAdminServiceV2';

let app: Express;
let authServer: http.Server;
let federatedAdminServer: ApolloServer;
let accessToken: string;
let user_id: string;
const port = 15000;
const authPort = process.env.OAUTH_SERVER_PORT;
const authUri = `http://localhost:${authPort}/graphql`;
const headers = { 'content-type': 'application/json' };
const username = `tester${Math.floor(Math.random() * 10000)}`;
const email = `${username}@example.com`;
const password = 'password';
const admin_password = process.env.ADMIN_PASSWORD || 'admin_test';

const dbConnection = createDbConnection({
  name: 'default',
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'docker',
  database: 'gw-node-admin-test',
  logging: false,
  synchronize: true,
  dropSchema: true
});

type QueryResponse = {
  body: {
    data: any;
    errors: ApolloError[];
  };
};

beforeAll(async () => {
  // if uncomment, send to file logger
  // Client.setLogger(logger);

  // step 1: start admin service (federated service)
  federatedAdminServer = await createAdminServiceV2({
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    peerName: process.env.PEER_NAME,
    caAdminEnrollmentId: process.env.CA_ENROLLMENT_ID_ADMIN,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET
  });
  await federatedAdminServer.listen({ port });

  // step 2: prepare federated gateway
  app = await createGateway({
    serviceList: [
      {
        name: 'admin',
        url: `http://localhost:${port}/graphql`
      }
    ],
    authenticationCheck: 'http://localhost:3311/oauth/authenticate'
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
describe('Service-admin Integration Tests', () => {
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

  /*
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

  // it('should getBlockByNumber', async () =>
  //   request(app)
  //     .post('/graphql')
  //     .send({
  //       operationName: 'GetBlockByNumber',
  //       query: GET_BLOCK_BY_NUMBER,
  //       variables: { blockNumber: 10 }
  //     })
  //     .expect(({ body: { data, errors } }) => {
  //       expect(errors).toBeUndefined();
  //       expect(data?.getBlockByNumber.block_number).toEqual('10');
  //     }));

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
*/
});