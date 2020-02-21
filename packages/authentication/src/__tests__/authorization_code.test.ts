import { createDb } from './__utils__/createDb';

require('../env');
import { Express } from 'express';
import request from 'supertest';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import {
  CREATE_APP_FOR_AUTHCODE,
  CREATE_ROOT_CLIENT,
  LOGIN,
  REGISTER_ADMIN
} from '../query';
import { ClientResolver, OUserResolver } from '../resolvers';
import {
  INVALID_CLIENT,
  INVALID_GRANT_TYPE,
  INVALID_URI,
  MISSING_CLIENT_ID,
  MISSING_CODE,
  MISSING_GRANT_TYPE,
  MISSING_REDIRECT_URI,
  MISSING_RESPONSE_TYPE,
  MISSING_STATE
} from '../types';
import { createHttpServer } from '../utils';

const dbConnection = {
  name: 'default',
  type: 'postgres' as any,
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: false,
  synchronize: true,
  dropSchema: true,
  entities: [OUser, Client, AccessToken, AuthorizationCode, RefreshToken]
};

let app: Express;
let accessToken: string;
let refreshToken: string;
let client_id: string;
let client_secret: string;
let user_id: string;
let code: string;
const username = `tester${Math.floor(Math.random() * 10000)}`;
const email = `${username}@example.com`;
const password = 'password';
const applicationName = 'testApp';
const grants = ['client_credentials', 'authorization_code', 'refresh_token'];
const redirect_uri = 'http://example.com/callback';
const state = '999';
const grant_type = 'authorization_code';
const response_type = 'code';
const rootAdmin = process.env.ROOT_ADMIN;
const rootAdminPassword = process.env.ROOT_ADMIN_PASSWORD;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

beforeAll(async () => {
  try {
    await createDb({
      database: process.env.TYPEORM_DATABASE,
      host: process.env.TYPEORM_HOST,
      port: process.env.TYPEORM_PORT,
      user: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD
    });

    app = await createHttpServer({
      rootAdmin,
      rootAdminPassword,
      dbConnection,
      resolvers: [OUserResolver, ClientResolver],
      oauthOptions: {
        requireClientAuthentication: {
          password: false,
          refreshToken: false,
          authorization_code: true
        },
        accessTokenLifetime: 300,
        refreshTokenLifetime: 1500
      },
      modelOptions: { accessTokenSecret, refreshTokenSecret }
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

// this is workaround for unfinished handler issue with jest and supertest
afterAll(async () => new Promise(done => setTimeout(() => done(), 500)));

describe('Authorization Code Grant Type Tests', () => {
  it('should create RootClient', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: { admin: rootAdmin, password: rootAdminPassword }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(typeof data?.createRootClient).toBe('string');
      }));

  it('should register new (admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Register',
        query: REGISTER_ADMIN,
        variables: {
          email,
          password,
          username,
          admin_password: rootAdminPassword
        }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.register).toBeTruthy();
      }));

  it('should login new (admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Login',
        query: LOGIN,
        variables: { email, password }
      })
      .expect(({ body: { data, errors }, header }) => {
        expect(errors).toBeUndefined();
        refreshToken = header['set-cookie'][0].split('; ')[0].split('=')[1];
        accessToken = data.login.accessToken;
        user_id = data.login.user.id;
        expect(data.login.ok).toBeTruthy();
        expect(data.login.accessToken).toBeDefined();
        expect(data.login.user.email).toEqual(email);
        expect(data.login.user.username).toEqual(username);
      }));

  it('should create application client', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'CreateApplication',
        query: CREATE_APP_FOR_AUTHCODE,
        variables: { applicationName, grants, redirect_uri }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        client_id = data.createApplication.client_id;
        client_secret = data.createApplication.client_secret;
        expect(data.createApplication.ok).toBeTruthy();
        expect(data.createApplication.redirect_uri).toEqual(redirect_uri);
      }));

  it('should fail to get /oauth/authorize: missing client_id', async () =>
    request(app)
      .get('/oauth/authorize')
      .query({
        redirect: '/oauth/authorize',
        client_id: null,
        client_secret,
        redirect_uri,
        state,
        grant_type,
        response_type: 'code'
      })
      .expect(({ status, body }) => {
        expect(status).toEqual(400);
        expect(body?.message).toEqual(MISSING_CLIENT_ID);
      }));

  it('should fail to get /oauth/authorize: missing redirect_uri', async () =>
    request(app)
      .get('/oauth/authorize')
      .query({
        redirect: '/oauth/authorize',
        client_id,
        client_secret,
        redirect_uri: null,
        state,
        grant_type,
        response_type: 'code'
      })
      .expect(({ status, body }) => {
        expect(status).toEqual(400);
        expect(body?.message).toEqual(MISSING_REDIRECT_URI);
      }));

  it('should fail to get /oauth/authorize: missing state', async () =>
    request(app)
      .get('/oauth/authorize')
      .query({
        redirect: '/oauth/authorize',
        client_id,
        client_secret,
        redirect_uri,
        state: null,
        grant_type,
        response_type: 'code'
      })
      .expect(({ status, body }) => {
        expect(status).toEqual(400);
        expect(body?.message).toEqual(MISSING_STATE);
      }));

  it('should fail to get /oauth/authorize: missing grant_type', async () =>
    request(app)
      .get('/oauth/authorize')
      .query({
        redirect: '/oauth/authorize',
        client_id,
        client_secret,
        redirect_uri,
        state,
        grant_type: null,
        response_type: 'code'
      })
      .expect(({ status, body }) => {
        expect(status).toEqual(400);
        expect(body?.message).toEqual(MISSING_GRANT_TYPE);
      }));

  it('should fail to get /oauth/authorize: missing response_type', async () =>
    request(app)
      .get('/oauth/authorize')
      .query({
        redirect: '/oauth/authorize',
        client_id,
        client_secret,
        redirect_uri,
        state,
        grant_type,
        response_type: null
      })
      .expect(({ status, body }) => {
        expect(status).toEqual(400);
        expect(body?.message).toEqual(MISSING_RESPONSE_TYPE);
      }));

  it('should get /oauth/authorize', async () =>
    request(app)
      .get('/oauth/authorize')
      .query({
        redirect: '/oauth/authorize',
        client_id,
        client_secret,
        redirect_uri,
        state,
        grant_type,
        response_type: 'code'
      })
      .expect(({ header: { location } }) =>
        expect(
          location.startsWith('/login?redirect=/oauth/authorize&client_id=')
        ).toBeTruthy()
      ));

  it('should post /login & get /oauth/authorize', async () =>
    request(app)
      .post('/login')
      .send({
        email,
        password,
        redirect: '/oauth/authorize',
        client_id,
        redirect_uri,
        state,
        grant_type,
        response_type
      })
      .redirects(1)
      .expect(({ text }) => {
        user_id = text.split(`"user" value="`)[1].split(`"><`)[0];
        expect(typeof user_id).toBe('string');
      }));

  it('should fail to post /oauth/authorize (auth_code): missing client_id', async () =>
    request(app)
      .post('/oauth/authorize')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send({
        user_id,
        client_id: null,
        client_secret,
        redirect_uri,
        state,
        grant_type,
        response_type
      })
      .expect(({ status, body }) => {
        expect(status).toEqual(400);
        expect(body?.ok).toBeFalsy();
        expect(body?.authorization_code).toBeFalsy();
        expect(body?.message).toEqual(MISSING_CLIENT_ID);
      }));

  it('should fail to post /oauth/authorize (auth_code): missing state', async () =>
    request(app)
      .post('/oauth/authorize')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send({
        user_id,
        client_id,
        client_secret,
        redirect_uri,
        state: null,
        grant_type,
        response_type
      })
      .expect(({ status, body }) => {
        expect(status).toEqual(400);
        expect(body?.ok).toBeFalsy();
        expect(body?.authorization_code).toBeFalsy();
        expect(body?.message).toEqual(MISSING_STATE);
      }));

  it('should fail to post /oauth/authorize (auth_code): missing response_type', async () =>
    request(app)
      .post('/oauth/authorize')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send({
        user_id,
        client_id,
        client_secret,
        redirect_uri,
        state,
        grant_type,
        response_type: null
      })
      .expect(({ status, body }) => {
        expect(status).toEqual(400);
        expect(body?.ok).toBeFalsy();
        expect(body?.authorization_code).toBeFalsy();
        expect(body?.message).toEqual(MISSING_RESPONSE_TYPE);
      }));

  // Note: grant_type and/or redirect_uri is nullable. Do not seem to impact.
  // But this is a bit strange.
  it('should post /oauth/authorize, (get auth_code)', async () =>
    request(app)
      .post('/oauth/authorize')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send({
        user_id,
        client_id,
        client_secret,
        redirect_uri,
        state,
        grant_type,
        response_type
      })
      .expect(({ status, header: { location } }) => {
        expect(status).toBe(302);
        code = location.split('code=')[1].split('?state')[0];
        expect(location.startsWith('http://example.com/callback'));
        expect(location.endsWith(`state=${state}`));
      }));

  it('should fail to obtain access token: missing client_id', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=&grant_type=${grant_type}&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_uri}`
      )
      .expect(({ status, body }) => {
        expect(status).toBe(400);
        expect(body?.ok).toBeFalsy();
        expect(body?.message).toEqual(MISSING_CLIENT_ID);
      }));

  it('should fail to obtain access token: invalid grant_type', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=${client_id}&grant_type=&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_uri}`
      )
      .expect(({ status, body }) => {
        expect(status).toBe(400);
        expect(body?.ok).toBeFalsy();
        expect(body?.message).toEqual(INVALID_GRANT_TYPE);
      }));

  it('should fail to obtain access token: missing client_secret', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=${client_id}&grant_type=${grant_type}&client_secret=&code=${code}&redirect_uri=${redirect_uri}`
      )
      .expect(({ status, body }) => {
        expect(status).toBe(400);
        expect(body?.ok).toBeFalsy();
        expect(body?.message).toEqual(INVALID_CLIENT);
      }));

  it('should fail to obtain access token: missing auth_code', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=${client_id}&grant_type=${grant_type}&client_secret=${client_secret}&code=&redirect_uri=${redirect_uri}`
      )
      .expect(({ status, body }) => {
        expect(status).toBe(400);
        expect(body?.ok).toBeFalsy();
        expect(body?.message).toEqual(MISSING_CODE);
      }));

  it('should fail to obtain access token: invalid redirect_uri', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=${client_id}&grant_type=${grant_type}&client_secret=${client_secret}&code=${code}&redirect_uri=`
      )
      .expect(({ status, body }) => {
        expect(status).toBe(400);
        expect(body?.ok).toBeFalsy();
        expect(body?.message).toEqual(INVALID_URI);
      }));

  it('should obtain access token', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=${client_id}&grant_type=${grant_type}&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_uri}`
      )
      .expect(({ status, body }) => {
        expect(status).toBe(200);
        expect(body?.ok).toBeTruthy();
        expect(typeof body.token.accessToken).toBe('string');
        expect(body?.token?.client?.id).toEqual(client_id);
      }));
});
