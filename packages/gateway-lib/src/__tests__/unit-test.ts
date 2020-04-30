require('../env');
import { createNetworkOperator, NetworkOperator, enrollAdmin } from '@fabric-es/operator';
import { Wallets } from 'fabric-network';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import request from 'supertest';
import { createAdminService } from '../admin';
import { createGateway, isLoginResponse, isRegisterResponse } from '../utils';

const authServerUri = process.env.AUTHORIZATION_SERVER;
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
const username = '';
const password = '';
const email = '';

let operator: NetworkOperator;

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

    const adminService = await createAdminService({
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

    operator = await createNetworkOperator({
      channelName,
      ordererTlsCaCert,
      ordererName,
      fabricNetwork,
      connectionProfile,
      wallet,
      caAdmin,
      caAdminPW,
      mspId
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

// afterAll(async () => {});

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
  it('should register new user', async () =>
    fetch(authServerUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    })
      .then<unknown>(r => r.json())
      .then(response => {
        if (isRegisterResponse(response)) {
        } else return false;
      }));

  it('should login new user', async () =>
    fetch(`${authServerUri}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then<unknown>(r => r.json())
      .then(response => {
        if (isLoginResponse(response)) {
        } else return false;
      }));
});
