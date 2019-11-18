import { Express } from 'express';
import request from 'supertest';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import '../env';
import {
  CREATE_APP_FOR_AUTHCODE,
  CREATE_ROOT_CLIENT,
  LOGIN,
  REGISTER_ADMIN
} from '../query';
import { ClientResolver } from '../resolvers/clientResolver';
import { OUserResolver } from '../resolvers/ouserResolver';
import { createHttpServer } from '../utils';

const dbConnection = {
  name: 'default',
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'testauthorizationcode',
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
const admin_password = process.env.ADMIN_PASSWORD || 'admin';
const applicationName = 'testApp';
const grants = ['client_credentials', 'authorization_code', 'refresh_token'];
const redirect_uri = 'http://example.com/callback';
const state = '999';
const grant_type = 'authorization_code';
const response_type = 'code';

beforeAll(async () => {
  app = await createHttpServer({
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
    }
  });
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
        variables: {
          admin: 'admin',
          password: 'admin'
        }
      })
      .expect(({ body }) => expect(body.data.createRootClient).toBeDefined()));

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
          admin_password
        }
      })
      .expect(({ body }) => expect(body.data.register).toEqual(true)));

  it('should login new (admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Login',
        query: LOGIN,
        variables: { email, password }
      })
      .expect(({ body: { data }, header }) => {
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
      .expect(({ body: { data } }) => {
        client_id = data.createApplication.client_id;
        client_secret = data.createApplication.client_secret;
        expect(data.createApplication.ok).toEqual(true);
        expect(data.createApplication.redirect_uri).toEqual(redirect_uri);
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
        expect(user_id).toBeDefined();
      }));

  it('should post /oauth/authorize, (get authorization code)', async () =>
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
      .expect(({ header: { location } }) => {
        code = location.split('code=')[1].split('?state')[0];
        expect(location.startsWith('http://example.com/callback'));
        expect(location.endsWith(`state=${state}`));
      }));

  it('should obtain access token', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=${client_id}&grant_type=${grant_type}&client_secret=${client_secret}&code=${code}&redirect_uri=${redirect_uri}`
      )
      .expect(({ body }) => {
        expect(body.ok).toBeTruthy();
        expect(body.token.accessToken).toBeDefined();
        expect(body.token.client.id).toEqual(client_id);
      }));
});
