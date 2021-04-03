require('dotenv').config({ path: './.env.test.auth0' });
import http from 'http';
import { URLSearchParams } from 'url';
import type { QueryHandler, RedisRepository } from '@fabric-es/fabric-cqrs';
import {
  buildRedisOptions,
  CREATE_WALLET,
  createAdminServiceWithAuth0,
  createGatewayWithAuth0,
  createQueryHandlerService,
  createService,
  getLogger,
  isAuth0UserInfo,
} from '@fabric-es/gateway-lib';
import {
  CREATE_DIDDOCUMENT,
  RESOLVE_DIDDOCUMENT,
  createKeyPair,
  DidDocument,
  DidDocumentEvents,
  didDocumentIndexDefinition,
  DidDocumentInRedis,
  didDocumentPostSelector,
  didDocumentPreSelector,
  didDocumentReducer,
  didDocumentResolvers,
  didDocumentTypeDefs,
  isVerificationMethod,
  waitForSecond,
  addressToDid,
  OutputDidDocument,
} from '@fabric-es/model-identity';
import { enrollAdmin } from '@fabric-es/operator';
import { ApolloServer } from 'apollo-server';
import DidJWT, { Signer } from 'did-jwt';
import { Resolver } from 'did-resolver';
import { Wallets } from 'fabric-network';
import type { RedisOptions } from 'ioredis';
import keys from 'lodash/keys';
import values from 'lodash/values';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import request from 'supertest';
import { createExpressApp } from '../routes';

const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const caName = process.env.CA_NAME;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const walletPath = process.env.WALLET;
// If requiring to change entityName, need to update the Context, and resolvers as well.
const entityName = 'didDocument';
const enrollmentId = orgAdminId;
const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;

let app: http.Server;
let adminApolloService: ApolloServer;
let modelApolloService: ApolloServer;
let redisOptions: RedisOptions;
let queryHandlerServer: ApolloServer;
let queryHandler: QueryHandler;
let redisRepos: Record<string, RedisRepository>;
let signInToken;

const MODEL_SERVICE_PORT = 15001;
const ADMIN_SERVICE_PORT = 15000;
const GATEWAY_PORT = 4001;
const QH_PORT = 4400;
const logger = getLogger('[gw-registrar] unit-test.js');

const { address, publicKey: publicKeyHex, privateKey } = createKeyPair();
const did = address;

/**
 * ./dn-run.sh 2 auth
 */
beforeAll(async () => {
  rimraf.sync(`${walletPath}/${orgAdminId}.id`);
  rimraf.sync(`${walletPath}/${caAdmin}.id`);

  try {
    redisOptions = buildRedisOptions(
      process.env.REDIS_HOST,
      (process.env.REDIS_PORT || 6379) as number,
      logger
    );

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
    const qhService = await createQueryHandlerService({
      asLocalhost: !(process.env.NODE_ENV === 'production'),
      authCheck: `${issuerBaseUrl}/userinfo`,
      channelName,
      connectionProfile,
      enrollmentId,
      redisOptions,
      wallet,
    })
      .addRedisRepository<DidDocument, DidDocumentInRedis, OutputDidDocument, DidDocumentEvents>(
        DidDocument,
        {
          reducer: didDocumentReducer,
          fields: didDocumentIndexDefinition,
          postSelector: didDocumentPostSelector,
          preSelector: didDocumentPreSelector,
        }
      )
      .run();

    queryHandlerServer = qhService.getServer();
    queryHandler = qhService.getQueryHandler();
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

    // Step 9: Prepare federated service
    const { config } = await createService({
      asLocalhost: true,
      channelName,
      connectionProfile,
      serviceName: 'didDocument',
      enrollmentId: orgAdminId,
      wallet,
      redisOptions,
    });

    // Step 10: config Apollo server with models
    modelApolloService = config([
      { typeDefs: didDocumentTypeDefs, resolvers: didDocumentResolvers },
    ])
      .addRepository<DidDocument, DidDocumentInRedis, OutputDidDocument, DidDocumentEvents>(
        DidDocument,
        {
          reducer: didDocumentReducer,
          fields: didDocumentIndexDefinition,
          postSelector: didDocumentPostSelector,
          preSelector: didDocumentPreSelector,
        }
      )
      .create();

    await modelApolloService.listen({ port: MODEL_SERVICE_PORT }, () =>
      console.log('model service started')
    );

    // step 11: Prepare Admin microservice
    const service = await createAdminServiceWithAuth0({
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
    app = await createGatewayWithAuth0({
      enrollmentId: orgAdminId,
      serviceList: [
        { name: 'admin', url: `http://localhost:${ADMIN_SERVICE_PORT}/graphql` },
        { name: 'didDocument', url: `http://localhost:${MODEL_SERVICE_PORT}/graphql` },
      ],
      authenticationCheck: `${issuerBaseUrl}/userinfo`,
      customExpressApp: createExpressApp(`http://localhost:${GATEWAY_PORT}/graphql`),
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
    .command_deleteByEntityId(entityName)({ id: did })
    .then(({ status }) =>
      console.log(`tear-down: command_deleteByEntityId, ${entityName}:${did}, status: ${status}`)
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

describe('gw-did test', () => {
  it('should reach oauth endpoint', async () =>
    fetch(`${issuerBaseUrl}/.well-known/openid-configuration`).then((r) => {
      if (r.status !== 200) return Promise.reject('fail to fetch openid configuration ');
      return r.json();
    }));

  it('should register new user, if not exist', async () => {
    const response = await fetch(`${issuerBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.AUTH0_MGT_CLIENT_ID,
        client_secret: process.env.AUTH0_MGT_CLIENT_SECRET,
        audience: 'https://dashslab.us.auth0.com/api/v2/',
        grant_type: 'client_credentials',
      }),
    }).then((r) => {
      console.log(`Obtain access_token for management api: ${r.status}`);
      return r.json();
    });
    const AUTH0_MGT_API_TOKEN = response?.access_token;

    if (!AUTH0_MGT_API_TOKEN) throw new Error('No access_token return for management api');

    return fetch(`${issuerBaseUrl}/api/v2/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${AUTH0_MGT_API_TOKEN}`,
      },
      body: JSON.stringify({
        email: process.env.AUTH0_USERNAME,
        given_name: 'John',
        family_name: 'Doe',
        name: 'John Doe',
        nickname: 'Johnny',
        picture:
          'https://secure.gravatar.com/avatar/15626c5e0c749cb912f9d1ad48dba440?s=480&r=pg&d=https%3A%2F%2Fssl.gstatic.com%2Fs2%2Fprofiles%2Fimages%2Fsilhouette80.png',
        connection: 'Username-Password-Authentication',
        password: process.env.AUTH0_PASSWORD,
        verify_email: false,
        app_metadata: { is_admin: true },
      }),
    })
      .then((r) => {
        console.log(`Create testing user, statusCode: ${r.status}`);
        return r.json();
      })
      .then((response) => console.log(response.message));
  });

  it('should exchange access_token', async () => {
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', process.env.AUTH0_CLIENT_ID);
    params.append('audience', process.env.AUTH0_AUDIENCE);
    params.append('username', process.env.AUTH0_USERNAME);
    params.append('password', process.env.AUTH0_PASSWORD);
    params.append('scope', process.env.AUTH0_SCOPE);
    params.append('client_secret', process.env.AUTH0_CLIENT_SECRET);

    await fetch(`${issuerBaseUrl}/oauth/token`, { method: 'POST', body: params })
      .then((r) => {
        expect(r.status).toEqual(200);
        return r.json();
      })
      .then((res) => (signInToken = res));

    if (!signInToken) process.exit(1);
  });

  it('should retrieve userinfo', async () =>
    fetch(`${issuerBaseUrl}/userinfo`, {
      headers: { authorization: `Bearer ${signInToken.access_token}` },
    })
      .then((r) => {
        expect(r.status).toEqual(200);
        return r.json();
      })
      .then((response) => expect(isAuth0UserInfo(response)).toBeTruthy()));

  // https://learn.mattr.global/api-ref#operation/wellKnownDidConfig
  it('should get well-known Did Configuration', async () =>
    fetch(`http://localhost:${GATEWAY_PORT}/.well-known/did-configuration`)
      .then((r) => r.json())
      .then((response) => expect(response).toBeDefined()));

  // createDidDocument: {
  //   id: '0xd6b2613744fa776ae2a081828e4ebc06e16b6dc2',
  //   entityName: 'didDocument',
  //   version: 0,
  //   commitId: '20210322153039749',
  //   entityId: '0xd6b2613744fa776ae2a081828e4ebc06e16b6dc2'
  // }
  it('should create didDocument', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${signInToken.access_token}`)
      .send({
        operationName: 'CreateDidDocument',
        query: CREATE_DIDDOCUMENT,
        variables: { did, publicKeyHex },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.createDidDocument.entityName).toEqual('didDocument');
        expect(data?.createDidDocument.id).toEqual(address);
        expect(data?.createDidDocument.version).toEqual(0);
        expect(errors).toBeUndefined();
      }));

  // {
  //   data: {
  //     resolveDidDocument: {
  //       context: 'https://www.w3.org/ns/did/v1',
  //       controller: 'did:fab:0xeea7e44545a7531dee4572828e532ac128c54e79',
  //       created: '2021-04-02T05:36:59.428Z',
  //       id: 'did:fab:0xeea7e44545a7531dee4572828e532ac128c54e79',
  //       keyAgreement: null,
  //       proof: null,
  //       service: null,
  //       verificationMethod: [Array],
  //       updated: '2021-04-02T05:36:59.428Z',
  //     },
  //   },
  // };
  it('should resolve didDocument', async () => {
    await waitForSecond(5);

    return fetch(`http://localhost:${GATEWAY_PORT}/did/${addressToDid(address)}`)
      .then((r) => r.json())
      .then((result) => {
        console.log(result);
        expect(result['@context']).toEqual('https://www.w3.org/ns/did/v1');
        expect(result.id).toEqual(`did:fab:${did}`);
        result.publicKey.forEach((item) =>
          expect(isVerificationMethod(item)).toBeTruthy()
        );
        expect(result.errorMessage).toBeUndefined();
      });
  });
});
