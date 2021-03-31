require('dotenv').config({ path: './.env.test' });
import http from 'http';
import { buildFederatedSchema } from '@apollo/federation';
import type { QueryHandler, RedisRepository } from '@fabric-es/fabric-cqrs';
import { Lifecycle } from '@fabric-es/fabric-cqrs';
import {
  buildRedisOptions,
  CREATE_WALLET,
  createAdminService,
  createGateway,
  createQueryHandlerService,
  createService,
  getLogger,
  isLoginResponse,
  isRegisterResponse,
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
  createDidDocument,
} from '@fabric-es/model-identity';
import { enrollAdmin } from '@fabric-es/operator';
import { ApolloServer } from 'apollo-server';
import DidJWT, { Signer } from 'did-jwt';
import { Resolver } from 'did-resolver';
import { Wallets } from 'fabric-network';
import httpStatus from 'http-status';
import type { RedisOptions } from 'ioredis';
import keys from 'lodash/keys';
import values from 'lodash/values';
import fetch from 'node-fetch';
import rimraf from 'rimraf';
import request from 'supertest';
import { getResolver } from '../getResolver';

/**
 * ./dn-run.1-db-red-auth.sh
 */

const caAdmin = process.env.CA_ENROLLMENT_ID_ADMIN;
const caAdminPW = process.env.CA_ENROLLMENT_SECRET_ADMIN;
const channelName = process.env.CHANNEL_NAME;
const connectionProfile = process.env.CONNECTION_PROFILE;
const caName = process.env.CA_NAME;
const mspId = process.env.MSPID;
const orgAdminId = process.env.ORG_ADMIN_ID;
const orgAdminSecret = process.env.ORG_ADMIN_SECRET;
const authServerUri = process.env.AUTHORIZATION_SERVER_URI;
const walletPath = process.env.WALLET;
const random = Math.floor(Math.random() * 10000);
const username = `gw_test_username_${random}`;
const password = `password`;
const email = `gw_test_${random}@test.com`;
// If requiring to change entityName, need to update the Context, and resolvers as well.
const entityName = 'didDocument';
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
const GATEWAY_PORT = 4001;
const QH_PORT = 4400;
const logger = getLogger('[gw-registrar] unit-test.js');

const { address, publicKey: publicKeyHex, privateKey } = createKeyPair();
const did = address;
const ENTITY_NAME = 'didDocument';

let didResolver: Resolver;
let jwt: string;

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
      authCheck: `${authServerUri}/oauth/authenticate`,
      channelName,
      connectionProfile,
      enrollmentId,
      redisOptions,
      wallet,
    })
      .addRedisRepository<DidDocument, DidDocumentInRedis, DidDocument, DidDocumentEvents>(
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

    // Step 9: Prepare Counter federated service
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
    modelApolloService = config([{ typeDefs: didDocumentTypeDefs, resolvers: didDocumentResolvers }])
      .addRepository<DidDocument, DidDocumentInRedis, DidDocument, DidDocumentEvents>(DidDocument, {
        reducer: didDocumentReducer,
        fields: didDocumentIndexDefinition,
        postSelector: didDocumentPostSelector,
        preSelector: didDocumentPreSelector,
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
        { name: 'didDocument', url: `http://localhost:${MODEL_SERVICE_PORT}/graphql` },
      ],
      authenticationCheck: `${authServerUri}/oauth/authenticate`,
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
  // for await (const [entityName, redisRepo] of Object.entries(redisRepos)) {
  //   await redisRepo
  //     .dropIndex(true)
  //     .then(() => console.log(`${entityName} - index is dropped`))
  //     .catch((error) => console.error(error));
  // }

  // await queryHandler
  //   .query_deleteCommitByEntityName(entityName)()
  //   .then(({ status }) =>
  //     console.log(`tear-down: query_deleteByEntityName, ${entityName}, status: ${status}`)
  //   );

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
  it(`should ping /isalive, ${authServerUri}`, async () =>
    fetch(`${authServerUri}/account/isalive`).then((r) => {
      if (r.status === httpStatus.NO_CONTENT) return true;
      else {
        console.error(`auth server is not alive, ${authServerUri}`);
        process.exit(1);
      }
    }));

  it('should register new user', async () =>
    fetch(`${authServerUri}/account`, {
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
    fetch(`${authServerUri}/account/login`, {
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

  it('should login OrgAdmin', async () =>
    fetch(`${authServerUri}/account/login`, {
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

  // createDidDocument: {
  //   id: '0xd6b2613744fa776ae2a081828e4ebc06e16b6dc2',
  //   entityName: 'didDocument',
  //   version: 0,
  //   commitId: '20210322153039749',
  //   entityId: '0xd6b2613744fa776ae2a081828e4ebc06e16b6dc2'
  // }
  it('should create didDocument', async () => {
    const payload = createDidDocument({ id: address, controllerKey: publicKeyHex });
    const signer: Signer = DidJWT.ES256KSigner(privateKey);
    const signedRequest = await DidJWT.createJWT(
      {
        aud: addressToDid(address),
        entityNamd: ENTITY_NAME,
        entityId: address,
        version: 0,
        events: [{ type: 'DidDocumentCreated', lifeCycle: Lifecycle.BEGIN, payload }],
      },
      { issuer: addressToDid(address), signer },
      { alg: 'ES256K' }
    );

    return request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'CreateDidDocument',
        query: CREATE_DIDDOCUMENT,
        variables: { did, signedRequest },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.createDidDocument.entityName).toEqual('didDocument');
        expect(errors).toBeUndefined();
      });
  });

  // returns
  // {
  //   context: 'https://www.w3.org/ns/did/v1',
  //   controller: '0x050e070bffae3ecb8227c2e935ce98dcde7e4158',
  //   created: '2021-03-04T13:35:29.129Z',
  //   id: '0x050e070bffae3ecb8227c2e935ce98dcde7e4158',
  //   keyAgreement: null,
  //   proof: null,
  //   verificationMethod: [
  //   {
  //     id: '0x050e070bffae3ecb8227c2e935ce98dcde7e4158',
  //     type: 'Secp256k1VerificationKey2018',
  //     controller: '0x050e070bffae3ecb8227c2e935ce98dcde7e4158',
  //     publicKeyHex: '04c4dbd496170f76004356d555521a53eb8e584924f780e5cfc5a216accf01a02ce6b7ac804bad19e28087c8690bb645780147d8b03dff003dd191818446158c9c'
  //   }
  // ],
  //   service: null,
  //   updated: '2021-03-04T13:35:29.129Z'
  // }
  it('should resolve didDocument', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'ResolveDidDocument',
        query: RESOLVE_DIDDOCUMENT,
        variables: { did },
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.resolveDidDocument.context).toEqual('https://www.w3.org/ns/did/v1');
        expect(data?.resolveDidDocument.id).toEqual(`did:fab:${did}`);
        data?.resolveDidDocument.verificationMethod.forEach((item) =>
          expect(isVerificationMethod(item)).toBeTruthy()
        );
        expect(errors).toBeUndefined();
      }));

  it('should getResolver()', async () => {
    const fabricDidResolver = getResolver(`http://localhost:${GATEWAY_PORT}/graphql`);
    didResolver = new Resolver(fabricDidResolver);
    const { didDocument } = await didResolver.resolve(`did:fab:${did}`);
    expect(didDocument['@context']).toEqual('https://www.w3.org/ns/did/v1');
    expect(didDocument.id).toEqual(`did:fab:${did}`);
  });

  /*
  // this unit test validate the jwt is created and signed with right "audience", based on DID.
  it('should createJWT with did-jwt', async () => {
    const signer: Signer = DidJWT.ES256KSigner(privateKey);

    // returns eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE2MTUwMDQ5MjcsImV4cCI6MTk1NzQ2MzQyMSwiYXVkIjoiZGlkOmZhYjoweDFkZGMzNmZkOTkwYTM0OTVkYTcyMTE5YTRkOTRhOTAyMjY0MGYyNjIiLCJuYW1lIjoibXkgRGV2ZWxvcGVyIiwiaXNzIjoiZGlkOmZhYjoweDFkZGMzNmZkOTkwYTM0OTVkYTcyMTE5YTRkOTRhOTAyMjY0MGYyNjIifQ.GVlTNiIX36E2bgiLEb-Esw__6IoRIeeY-9Mu5vkWwSYAU8Hru6vtteVfKAdrk-o36TrnTDJNdc7pXER1x6-ovw
    jwt = await DidJWT.createJWT(
      { aud: addressToDid(did), exp: 1957463421, name: 'my Developer' },
      { issuer: addressToDid(did), signer },
      { alg: 'ES256K' }
    );
    const decoded = DidJWT.decodeJWT(jwt);
    // {
    // {
    //   header: { alg: 'ES256K', typ: 'JWT' },
    //   payload: {
    //     iat: 1615004927,
    //     exp: 1957463421,
    //     aud: 'did:fab:0x1ddc36fd990a3495da72119a4d94a9022640f262',
    //     name: 'my Developer',
    //     iss: 'did:fab:0x1ddc36fd990a3495da72119a4d94a9022640f262'
    //   },
    //   signature: 'GVlTNiIX36E2bgiLEb-Esw__6IoRIeeY-9Mu5vkWwSYAU8Hru6vtteVfKAdrk-o36TrnTDJNdc7pXER1x6-ovw',
    //   data: 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE2MTUwMDQ5MjcsImV4cCI6MTk1NzQ2MzQyMSwiYXVkIjoiZGlkOmZhYjoweDFkZGMzNmZkOTkwYTM0OTVkYTcyMTE5YTRkOTRhOTAyMjY0MGYyNjIiLCJuYW1lIjoibXkgRGV2ZWxvcGVyIiwiaXNzIjoiZGlkOmZhYjoweDFkZGMzNmZkOTkwYTM0OTVkYTcyMTE5YTRkOTRhOTAyMjY0MGYyNjIifQ'
    // }

    const resolver = {
      resolve: (did: string) =>
        didResolver.resolve(did).then(({ didDocument }) => {
          // WORKAROUND: publicKey is deprecated field; however did-jwt remains dependent on it.
          const doc = { ...didDocument, publicKey: didDocument.verificationMethod };
          return doc as any;
        }),
    };

    const verificationResponse = await DidJWT.verifyJWT(jwt, {
      resolver,
      audience: addressToDid(did),
    });

    // {
    //   payload: {
    //     iat: 1615013083,
    //     exp: 1957463421,
    //     aud: 'did:fab:0x8837690e47512bd479aa6514dd549951f0fd0f64',
    //     name: 'my Developer',
    //     iss: 'did:fab:0x8837690e47512bd479aa6514dd549951f0fd0f64'
    //   },
    //   doc: {
    //     controller: 'did:fab:0x8837690e47512bd479aa6514dd549951f0fd0f64',
    //     created: '2021-03-06T06:44:38.369Z',
    //     id: 'did:fab:0x8837690e47512bd479aa6514dd549951f0fd0f64',
    //     keyAgreement: null,
    //     proof: null,
    //     service: null,
    //     verificationMethod: [ [Object] ],
    //     updated: '2021-03-06T06:44:38.369Z',
    //     '@context': 'https://www.w3.org/ns/did/v1',
    //     publicKey: [ [Object] ]
    //   },
    //   issuer: 'did:fab:0x8837690e47512bd479aa6514dd549951f0fd0f64',
    //   signer: {
    //     id: 'did:fab:0x8837690e47512bd479aa6514dd549951f0fd0f64',
    //     type: 'Secp256k1VerificationKey2018',
    //     publicKeyHex: '042dc447b47d2cc1ebcc5aab1882ae28af8aa6aa05b184e968be611af8080fd336d3b8116f7dce910f7f0b51d1e0b1bbaab588e92ce84df0797a27787f2654976c',
    //     controller: 'did:fab:0x8837690e47512bd479aa6514dd549951f0fd0f64'
    //   },
    //   jwt: 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE2MTUwMTMwODMsImV4cCI6MTk1NzQ2MzQyMSwiYXVkIjoiZGlkOmZhYjoweDg4Mzc2OTBlNDc1MTJiZDQ3OWFhNjUxNGRkNTQ5OTUxZjBmZDBmNjQiLCJuYW1lIjoibXkgRGV2ZWxvcGVyIiwiaXNzIjoiZGlkOmZhYjoweDg4Mzc2OTBlNDc1MTJiZDQ3OWFhNjUxNGRkNTQ5OTUxZjBmZDBmNjQifQ.735u73_oQI5oAO7ibjq39PrEwCBNh6bJNpOe6da1ZmOgsDdoYg3Jq7xn0DT4a5iwANlubT-8zcWhaQiiE092Hw'
    // }

    expect(verificationResponse.payload.name).toEqual('my Developer');
  });

   */
});
