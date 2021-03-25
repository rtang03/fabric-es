require('dotenv').config({ path: './.env.test' });
import http from 'http';
import {
  CounterInRedis,
  counterIndexDefinition,
  counterPreSelector,
  counterPostSelector,
  QueryHandler,
  Counter,
  CounterEvents,
  counterReducerCallback,
  OutputCounter,
  RedisRepository,
} from '@fabric-es/fabric-cqrs';
import { enrollAdmin } from '@fabric-es/operator';
import { ApolloServer } from 'apollo-server';
import { Wallets } from 'fabric-network';
import httpStatus from 'http-status';
import type { RedisOptions } from 'ioredis';
import keys from 'lodash/keys';
import values from 'lodash/values';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import request from 'supertest';
import { createAdminService } from '../admin';
import { IDENTITY_ALREADY_EXIST, UNAUTHORIZED_ACCESS } from '../admin/constants';
import {
  CREATE_WALLET,
  GET_CA_IDENTITY_BY_USERNAME,
  GET_WALLET,
  LIST_WALLET,
} from '../admin/query';
import { createQueryHandlerService } from '../queryHandler';
import { QueryResponse } from '../types';
import {
  createGateway,
  createService,
  isCaIdentity,
  isLoginResponse,
  isRegisterResponse,
  waitForSecond,
} from '../utils';
import { DECREMENT, GET_COUNTER, INCREMENT, resolvers, SEARCH, typeDefs } from './__utils__';

/**
 * ./dn-run.1-db-red-auth.sh or ./dn-run.2-db-red-auth.sh
 * note: this is using counter inside __utils__. The counter has no 'desc' 'tag'. And hence,
 * no full text search is available. This is intentionally made to minimal implementation.
 */

const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const caName = process.env.CA_NAME;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const proxyServerUri = process.env.PROXY_SERVER;
const walletPath = process.env.WALLET;
const random = Math.floor(Math.random() * 10000);
const username = `gw_test_username_${random}`;
const password = `password`;
const email = `gw_test_${random}@test.com`;
const counterId = `counter_${random}`;
// If requiring to change entityName, need to update the Context, and resolvers as well.
const entityName = 'counter';
const enrollmentId = orgAdminId;

let app: http.Server;
let adminApolloService: ApolloServer;
let modelApolloService: ApolloServer;
let userId: string;
let accessToken: string;
let adminAccessToken: string;
let redisOptions: RedisOptions;
let queryHandlerServer: ApolloServer;
let queryHandler: QueryHandler;
let redisRepos: Record<string, RedisRepository>;

const MODEL_SERVICE_PORT = 15001;
const ADMIN_SERVICE_PORT = 15000;
const GATEWAY_PORT = 4000;
const QH_PORT = 4400;
const sleep5 = new Promise((resolve) => setTimeout(() => resolve(true), 5000));

/**
 * ./dn-run-1-px-db-red-auth.sh
 */

beforeAll(async () => {
  rimraf.sync(`${walletPath}/${orgAdminId}.id`);
  rimraf.sync(`${walletPath}/${caAdmin}.id`);

  try {
    redisOptions = {};

    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Step 1: EnrollAdmin
    await enrollAdmin({
      enrollmentID: orgAdminId,
      enrollmentSecret: orgAdminSecret,
      connectionProfile,
      caName,
      mspId,
      wallet,
    });

    // Step 2: EnrollCaAdmin
    await enrollAdmin({
      enrollmentID: caAdmin,
      enrollmentSecret: caAdminPW,
      connectionProfile,
      caName,
      mspId,
      wallet,
    });

    // Step 3. create QueryHandlerService
    Counter.entityName = entityName;
    const qhService = await createQueryHandlerService({
      asLocalhost: !(process.env.NODE_ENV === 'production'),
      authCheck: `${proxyServerUri}/oauth/authenticate`,
      channelName,
      connectionProfile,
      enrollmentId,
      redisOptions: { host: 'localhost', port: 6379 },
      wallet,
    })
      .addRedisRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(
        Counter, {
          reducer: counterReducerCallback,
          fields: counterIndexDefinition,
          postSelector: counterPostSelector,
          preSelector: counterPreSelector,
      })
      .run();

    queryHandlerServer = qhService.getServer();
    queryHandler = qhService.getQueryHandler();
    // redisRepos will be later use for manually creating and dropping indexes
    redisRepos = qhService.getRedisRepos();

    // Step 6: clean-up before tests
    const { data } = await queryHandler.command_getByEntityName(entityName)();
    if (keys(data).length > 0) {
      for await (const { id } of values(data)) {
        await queryHandler
          .command_deleteByEntityId(entityName)({ id })
          .then(({ status }) => console.log(`status: ${status}, ${entityName}:${id} deleted`));
      }
    }

    // Step 7: clean up pre existing Redis records
    await queryHandler
      .query_deleteCommitByEntityName(entityName)()
      .then(({ status }) =>
        console.log(`set-up: query_deleteByEntityName, ${entityName}, status: ${status}`)
      );

    await queryHandler
      .query_deleteCommitByEntityName('organization')()
      .then(({ status }) =>
        console.log(`set-up: query_deleteByEntityName: organization, status: ${status}`)
      );

    // Step 8: start queryHandler
    await queryHandlerServer.listen({ port: QH_PORT }, () =>
      console.log('queryHandler server started')
    );

    // Step 9: Prepare Counter federated service
    const { config } = await createService({
      asLocalhost: true,
      channelName,
      connectionProfile,
      serviceName: 'counter',
      enrollmentId: orgAdminId,
      wallet,
      redisOptions,
    });

    // Step 10: config Apollo server with models
    Counter.entityName = entityName;
    modelApolloService = config([{ typeDefs, resolvers }])
      // define the Redisearch index, and selectors
      .addRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(Counter, {
        reducer: counterReducerCallback,
        fields: counterIndexDefinition,
        postSelector: counterPostSelector,
        preSelector: counterPreSelector,
      })
      .create();

    await modelApolloService.listen({ port: MODEL_SERVICE_PORT }, () =>
      console.log('model service started')
    );

    // step 11: Prepare Admin microservice
    const service = await createAdminService({
      asLocalhost: !(process.env.NODE_ENV === 'production'),
      caAdmin,
      caAdminPW,
      channelName,
      connectionProfile,
      caName,
      introspection: false,
      playground: false,
      walletPath,
      orgName: 'org1',
      orgUrl: `http://localhost:${MODEL_SERVICE_PORT}/graphql`,
      redisOptions,
    });
    adminApolloService = service.server;

    await adminApolloService.listen({ port: ADMIN_SERVICE_PORT }, () =>
      console.log('admin service started')
    );

    // Step 12: Prepare Federated Gateway
    app = await createGateway({
      serviceList: [
        { name: 'admin', url: `http://localhost:${ADMIN_SERVICE_PORT}/graphql` },
        { name: 'counter', url: `http://localhost:${MODEL_SERVICE_PORT}/graphql` },
      ],
      authenticationCheck: `${proxyServerUri}/oauth/authenticate`,
    });

    // Step 13: Start Gateway
    return new Promise<void>((done) =>
      app.listen(GATEWAY_PORT, () => {
        console.log('🚀  Federated Gateway started');
        done();
      })
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

// Tear-down the tests in queryHandler shall perform cleanup, for both command & query; so that
// unit-test can run repeatedly
afterAll(async () => {
  for await (const [entityName, redisRepo] of Object.entries(redisRepos)) {
    await redisRepo
      .dropIndex(true)
      .then(() => console.log(`${entityName} - index is dropped`))
      .catch((error) => console.error(error));
  }

  await queryHandler
    .query_deleteCommitByEntityName(entityName)()
    .then(({ status }) =>
      console.log(`tear-down: query_deleteByEntityName, ${entityName}, status: ${status}`)
    );

  await queryHandler
    .query_deleteCommitByEntityName('organization')()
    .then(({ status }) =>
      console.log(`tear-down: query_deleteByEntityName: organization, status: ${status}`)
    );

  await queryHandler
    .command_deleteByEntityId(entityName)({ id: counterId })
    .then(({ status }) =>
      console.log(
        `tear-down: command_deleteByEntityId, ${entityName}:${counterId}, status: ${status}`
      )
    );

  await queryHandler
    .command_deleteByEntityId('organization')({ id: 'Org1MSP' })
    .then(({ status }) =>
      console.log(`tear-down: command_deleteByEntityId, organization::Org1MSP, status: ${status}`)
    );

  await modelApolloService.stop();
  await adminApolloService.stop();
  await queryHandlerServer.stop();

  return waitForSecond(3);
});

describe('Gateway Test - admin service', () => {
  it('should ping /isalive', async () =>
    fetch(`${proxyServerUri}/account/isalive`).then((r) => {
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
      body: JSON.stringify({ username, email, password }),
    })
      .then<unknown>((r) => r.json())
      .then((res) => {
        if (isRegisterResponse(res)) {
          userId = res?.id;
          return true;
        } else return Promise.reject('not register response');
      }));

  it('should login new user', async () =>
    fetch(`${proxyServerUri}/account/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then<unknown>((r) => r.json())
      .then((res) => {
        if (isLoginResponse(res)) {
          accessToken = res.access_token;
          return true;
        } else return Promise.reject('not login response');
      }));

  it('should say hello to counter-service', async () =>
    request(app)
      .post('/graphql')
      .send({
        query: `query pingCounter { pingCounter }`,
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.pingCounter).toEqual('I am a simple counter');
        expect(errors).toBeUndefined();
      }));

  it('should login OrgAdmin', async () =>
    fetch(`${proxyServerUri}/account/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: orgAdminId, password: orgAdminSecret }),
    })
      .then<unknown>((r) => r.json())
      .then((res) => {
        if (isLoginResponse(res)) {
          adminAccessToken = res.access_token;
          return true;
        } else return Promise.reject('not login response');
      }));

  it('should fail to listWallet: with non-admin accessToken', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'ListWallet',
        query: LIST_WALLET,
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
        query: LIST_WALLET,
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
        query: GET_WALLET,
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.getWallet).toBeNull();
        expect(errors[0]?.message).toEqual('could not find user');
      }));

  it('should getWallet: with accessToken', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${adminAccessToken}`)
      .send({
        operationName: 'GetWallet',
        query: GET_WALLET,
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.getWallet.type).toEqual('X.509');
        expect(data?.getWallet.mspId).toEqual('Org1MSP');
        expect(errors).toBeUndefined();
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
      })
      .expect(({ body: { data, errors } }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toContain(IDENTITY_ALREADY_EXIST);
      }));

  it('should fail to increment counter, before creating wallet', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'Increment',
        query: INCREMENT,
        variables: { counterId, id: counterId },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toContain('Please register user');
      }));

  it('should createWallet', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'CreateWallet',
        query: CREATE_WALLET,
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.createWallet).toBeTruthy();
        expect(errors).toBeUndefined();
      }));

  it('should fail to increment counter without valid accessToken', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer invalid`)
      .send({
        operationName: 'Increment',
        query: INCREMENT,
        variables: { counterId },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data).toBeNull();
        expect(errors[0].message).toEqual('could not find user');
      }));

  it('should increment counter', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'Increment',
        query: INCREMENT,
        variables: { counterId, id: counterId },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.increment.id).toEqual(counterId);
        expect(data?.increment.entityName).toEqual(entityName);
        expect(data?.increment.version).toEqual(0);
        expect(errors).toBeUndefined();
      }));

  it('should increment counter', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'Increment',
        query: INCREMENT,
        variables: { counterId, id: counterId },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.increment.id).toEqual(counterId);
        expect(data?.increment.entityName).toEqual(entityName);
        expect(data?.increment.version).toEqual(0);
        expect(errors).toBeUndefined();
      }));

  it('should getCounter, value = 2', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'GetCounter',
        query: GET_COUNTER,
        variables: { counterId },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.getCounter).toEqual({ value: 2 });
        expect(errors).toBeUndefined();
      }));

  it('should decrement counter', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'Decrement',
        query: DECREMENT,
        variables: { counterId },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.decrement.id).toEqual(counterId);
        expect(data?.decrement.entityName).toEqual(entityName);
        expect(data?.decrement.version).toEqual(0);
        expect(errors).toBeUndefined();
      }));

  it('should search, value = 1', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'Search',
        query: SEARCH,
        variables: { query: 'counter_*' },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.search.items[0].value).toBe(1);
        expect(data?.search.items[0].description).toBe('');
        expect(data?.search.items[0].eventInvolved).toEqual([
          'Increment',
          'Increment',
          'Decrement',
        ]);
        expect(data?.search.total).toBe(1);
        expect(data?.search.cursor).toBe(1);
        expect(data?.search.hasMore).toBeFalsy();
        expect(errors).toBeUndefined();
      }));
});
