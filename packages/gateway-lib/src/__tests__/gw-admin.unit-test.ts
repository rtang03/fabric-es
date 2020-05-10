require('../env');
import { enrollAdmin } from '@fabric-es/operator';
import { ApolloServer } from 'apollo-server';
import express from 'express';
import { Wallets } from 'fabric-network';
import httpStatus from 'http-status';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import request from 'supertest';
import { createAdminService } from '../admin';
import { IDENTITY_ALREADY_EXIST, UNAUTHORIZED_ACCESS } from '../admin/constants';
import {
  CREATE_WALLET,
  GET_BLOCK_BY_NUMBER,
  GET_CA_IDENTITY_BY_USERNAME,
  GET_CHAIN_HEIGHT,
  GET_PEERINFO,
  GET_WALLET,
  LIST_WALLET
} from '../admin/query';
import { QueryResponse } from '../types';
import { createGateway, isCaIdentity, isLoginResponse, isRegisterResponse } from '../utils';

const proxyServerUri = `${process.env.PROXY_SERVER}`;
const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const caUrl = process.env.ORG_CA_URL;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const fabricNetwork = process.env.NETWORK_LOCATION;
const mspId = process.env.MSPID;
const ordererName = process.env.ORDERER_NAME;
const ordererTlsCaCert = process.env.ORDERER_TLSCA_CERT;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const peerName = process.env.PEER_NAME;
const walletPath = process.env.WALLET;
const random = Math.floor(Math.random() * 10000);
const username = `gw_test_username_${random}`;
const password = `password`;
const email = `gw_test_${random}@test.com`;

let app: express.Express;
let adminApolloService: ApolloServer;
let userId: string;
let accessToken: string;
let adminAccessToken: string;

const ADMIN_SERVICE_PORT = 15000;
const GATEWAY_PORT = 4000;

beforeAll(async () => {
  rimraf.sync(`${walletPath}/${orgAdminId}.id`);
  rimraf.sync(`${walletPath}/${caAdmin}.id`);

  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    await enrollAdmin({
      enrollmentID: orgAdminId,
      enrollmentSecret: orgAdminSecret,
      caUrl,
      connectionProfile,
      fabricNetwork,
      mspId,
      wallet
    });

    await enrollAdmin({
      enrollmentID: caAdmin,
      enrollmentSecret: caAdminPW,
      caUrl,
      connectionProfile,
      fabricNetwork,
      mspId,
      wallet
    });

    const service = await createAdminService({
      asLocalhost: false,
      caAdmin,
      caAdminPW,
      channelName,
      connectionProfile,
      fabricNetwork,
      introspection: false,
      mspId,
      ordererName,
      ordererTlsCaCert,
      peerName,
      playground: false,
      walletPath
    });
    adminApolloService = service.server;

    await adminApolloService.listen({ port: ADMIN_SERVICE_PORT }, () => {
      console.log('admin service started');
    });

    app = await createGateway({
      serviceList: [{ name: 'admin', url: `http://localhost:${ADMIN_SERVICE_PORT}/graphql` }],
      authenticationCheck: `${proxyServerUri}/oauth/authenticate`
    });

    return new Promise(done =>
      app.listen(GATEWAY_PORT, () => {
        console.log('Gateway started');
        done();
      })
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  await adminApolloService.stop();
  return new Promise(done => setTimeout(() => done(), 2000));
});

/**
 * Pre-requisite: running auth-server/postgres/redis in docker-compose
 * use '~/deployments/dev-net/dev-net-run.1org.auth.sh'
 * 1. Register new user in auth-server, via REST
 * 2. Login auth-server, via REST, to obtain access_token
 * 3. Launch adminService micro-service
 * 4. Launch Counter service
 * 5. Launch federated gateway
 */
describe('Gateway Test', () => {
  it('should ping /isalive', async () =>
    fetch(`${proxyServerUri}/account/isalive`).then(r => {
      if (r.status === httpStatus.NO_CONTENT) return true;
      else {
        console.error('auth server is not alive');
        process.exit(1);
      }
    }));

  it('should register new user', async () =>
    fetch(`${proxyServerUri}/account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })
      .then<unknown>(r => r.json())
      .then(res => {
        if (isRegisterResponse(res)) {
          userId = res?.id;
          return true;
        } else return false;
      }));

  it('should login new user', async () =>
    fetch(`${proxyServerUri}/account/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then<unknown>(r => r.json())
      .then(res => {
        if (isLoginResponse(res)) {
          accessToken = res.access_token;
          return true;
        } else return false;
      }));

  it('should say hello', async () =>
    request(app)
      .post('/graphql')
      .send({
        query: `query me { me }`
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.me).toEqual('Hello');
        expect(errors).toBeUndefined();
      }));

  it('should login OrgAdmin', async () =>
    fetch(`${proxyServerUri}/account/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: orgAdminId, password: orgAdminSecret })
    })
      .then<unknown>(r => r.json())
      .then(res => {
        if (isLoginResponse(res)) {
          adminAccessToken = res.access_token;
          return true;
        } else return false;
      }));

  it('should fail to listWallet: with non-admin accessToken', async () =>
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
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({
        operationName: 'ListWallet',
        query: LIST_WALLET
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.listWallet.toString()).toContain(orgAdminId);
      }));

  it('should fail to getWallet: without accessToken', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetWallet',
        query: GET_WALLET
      })
      .expect(({ body: { data, errors } }) => {
        expect(data).toBeNull();
        expect(errors[0]?.message).toEqual('could not find user');
      }));

  it('should getWallet: with accessToken', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({
        operationName: 'GetWallet',
        query: GET_WALLET
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.getWallet.type).toEqual('X.509');
        expect(data?.getWallet.mspId).toEqual('Org1MSP');
        expect(errors).toBeUndefined();
      }));

  it('should fail to getBlockByNumber: non-exist block', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({
        operationName: 'GetBlockByNumber',
        query: GET_BLOCK_BY_NUMBER,
        variables: { blockNumber: 10000 }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getBlockByNumber).toBeNull();
      }));

  it('should fail to getBlockByNumber without admin accessToken', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'GetBlockByNumber',
        query: GET_BLOCK_BY_NUMBER,
        variables: { blockNumber: 10 }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data.getBlockByNumber).toBeNull();
        expect(errors[0].message).toEqual(UNAUTHORIZED_ACCESS);
      }));

  it('should getBlockByNumber', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({
        operationName: 'GetBlockByNumber',
        query: GET_BLOCK_BY_NUMBER,
        variables: { blockNumber: 10 }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getBlockByNumber.block_number).toEqual('10');
      }));

  it('should getChainHeight', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({ operationName: 'GetChainHeight', query: GET_CHAIN_HEIGHT })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(typeof data?.getChainHeight).toEqual('number');
      }));

  it('should getPeerInfo', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({ operationName: 'GetPeerInfo', query: GET_PEERINFO })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.getPeerInfo).toEqual({ peerName: 'peer0-org1', mspId: 'Org1MSP' });
      }));

  it('should getCaIdentityByUsername', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({ operationName: 'GetCaIdentityByUsername', query: GET_CA_IDENTITY_BY_USERNAME })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(isCaIdentity(data?.getCaIdentityByUsername)).toBeTruthy();
      }));

  it('should fail createWallet: orgAdmin already exist in wallet', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({
        operationName: 'CreateWallet',
        query: CREATE_WALLET,
        variables: { enrollmentSecret: password }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual(IDENTITY_ALREADY_EXIST);
      }));

  it('should createWallet', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'CreateWallet',
        query: CREATE_WALLET,
        variables: { enrollmentSecret: password }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.createWallet).toBeTruthy();
        expect(errors).toBeUndefined();
      }));
});
