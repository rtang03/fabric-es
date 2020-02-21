require('../../env');
import { createAuthServer, createDbConnection } from '@espresso/authentication';
import { ApolloError, ApolloServer } from 'apollo-server';
import { Express } from 'express';
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
  IS_WALLET_EXIST,
  LIST_WALLET,
  LOGIN,
  REGISTER_ADMIN,
  REGISTER_AND_ENROLL_USER
} from '../..';
import {
  MISSING_VARIABLE,
  UNAUTHORIZED_ACCESS,
  USER_NOT_FOUND
} from '../constants';
import { createAdminService } from '../createAdminService';

let app: Express;
let authServer: http.Server;
let federatedAdminServer: ApolloServer;
let accessToken: string;
let user_id: string;
const port = process.env.ADMINISTRATOR_PORT;
const authPort = process.env.AUTH_SERVER_PORT;
const authUri = `http://localhost:${authPort}/graphql`;
const headers = { 'content-type': 'application/json' };
const username = `tester${Math.floor(Math.random() * 10000)}`;
const email = `${username}@example.com`;
const password = 'mypassword';
const rootAdmin = process.env.ROOT_ADMIN;
const rootAdminPassword = process.env.ROOT_ADMIN_PASSWORD;
const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;

type QueryResponse = {
  body: {
    data: any;
    errors: ApolloError[];
  };
};

beforeAll(async () => {
  // step 1: start admin service (federated service)
  ({ server: federatedAdminServer } = await createAdminService({
    ordererName: process.env.ORDERER_NAME,
    ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
    peerName: process.env.PEER_NAME,
    caAdminEnrollmentId: process.env.CA_ENROLLMENT_ID_ADMIN,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    fabricNetwork: process.env.NETWORK_LOCATION,
    walletPath: process.env.WALLET
  }));

  await federatedAdminServer.listen({ port });

  // step 2: prepare federated gateway
  app = await createGateway({
    serviceList: [
      {
        name: 'admin',
        url: `http://localhost:${port}/graphql`
      }
    ],
    authenticationCheck: `http://localhost:${authPort}/oauth/authenticate`
  });

  // step 3: start authentication server (expressjs)
  // NOTE: need to create database 'gw-node-admin-test' manually,
  // before running this test
  const auth = await createAuthServer({
    dbConnection: createDbConnection({
      name: process.env.TYPEORM_CONNECTION,
      type: 'postgres' as any,
      host: process.env.TYPEORM_HOST,
      port: process.env.TYPEORM_PORT,
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      logging: false,
      synchronize: true,
      dropSchema: true
    }),
    rootAdminPassword,
    rootAdmin
  });
  authServer = http.createServer(auth);
  authServer.listen(authPort);
});

afterAll(async () => {
  authServer.close();
  await federatedAdminServer.stop();

  // workaround for quiting this test properly
  return new Promise(done => setTimeout(() => done(), 500));
});

// require a running Fabric network
// run service.integration.test in fabric-cqrs, if no pre-existing onchain data
describe('Service-admin Integration Tests', () => {
  it('should fail to createRootClient: wrong password', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: { admin: rootAdmin, password: 'wrong password' }
      })
    })
      .then(res => res.json())
      .then(({ data, errors }) => {
        expect(data.createRootClient).toBeNull();
        expect(errors[0].message).toEqual('admin password mis-match');
      }));

  it('should createRootClient', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: { admin: rootAdmin, password: rootAdminPassword }
      })
    })
      .then(res => res.json())
      .then(({ data, errors }) => {
        expect(typeof data.createRootClient).toEqual('string');
        expect(errors).toBeUndefined();
      }));

  it('should fail to createRootClient again', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: { admin: rootAdmin, password: rootAdminPassword }
      })
    })
      .then(res => res.json())
      .then(({ data, errors }) => {
        expect(data.createRootClient).toBeNull();
        expect(errors[0].message).toEqual('already exist');
      }));

  it('should register new (admin) user', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'Register',
        query: REGISTER_ADMIN,
        variables: {
          email,
          password,
          username,
          admin_password: rootAdminPassword
        }
      })
    })
      .then(res => res.json())
      .then(({ data, errors }) => {
        expect(errors).toBeUndefined();
        expect(data.register).toBeTruthy();
      }));

  it('should fail to register new (admin) user, again', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'Register',
        query: REGISTER_ADMIN,
        variables: {
          email,
          password,
          username,
          admin_password: rootAdminPassword
        }
      })
    })
      .then(res => res.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('already exist');
      }));

  it('should fail to login new (admin) user', async () =>
    fetch(authUri, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operationName: 'Login',
        query: LOGIN,
        variables: { email, password: 'bad password' }
      })
    })
      .then(res => res.json())
      .then(({ data, errors }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('bad password');
      }));

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
      .then(({ data, errors }) => {
        accessToken = data.login.accessToken;
        user_id = data.login.user.id;
        expect(errors).toBeUndefined();
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
        operationName: 'IsWalletExist',
        query: IS_WALLET_EXIST
      })
      .expect(({ body: { data, errors } }) => {
        expect(data).toBeUndefined();
        expect(errors[0].message).toEqual(MISSING_VARIABLE);
      }));

  it('should isWalletEntryExist: wrong label', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'IsWalletExist',
        query: IS_WALLET_EXIST,
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
        operationName: 'IsWalletExist',
        query: IS_WALLET_EXIST,
        variables: { label: 'admin-org1.example.com' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.isWalletExist).toBeTruthy();
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
        expect(data?.getInstalledCCVersion).toEqual('1.0');
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
        expect(
          errors[0].message.startsWith('Error: fabric-ca request identities')
        ).toBeTruthy();
        expect(data?.getCaIdentityByEnrollmentId).toBeNull();
      }));

  it('should registerAndEnroll', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'RegisterAndEnrollUser',
        query: REGISTER_AND_ENROLL_USER,
        variables: {
          administrator: caAdmin,
          enrollmentId: user_id,
          enrollmentSecret: password
        }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data.registerAndEnrollUser).toBeTruthy();
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
        expect(data.getCaIdentityByEnrollmentId.id).toEqual(user_id);
      }));
});
