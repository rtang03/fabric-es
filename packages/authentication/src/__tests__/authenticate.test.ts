import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, './__utils__/.env.test') });

import { Express } from 'express';
import request from 'supertest';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import { CREATE_ROOT_CLIENT, LOGIN, REGISTER_ADMIN } from '../query';
import { ClientResolver, OUserResolver } from '../resolvers';
import { UNAUTHORIZED_REQUEST } from '../types';
import { createHttpServer } from '../utils';

const dbConnection = {
  name: 'default',
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'docker',
  database: 'testauthenticate',
  logging: false,
  synchronize: true,
  dropSchema: true,
  entities: [OUser, Client, AccessToken, AuthorizationCode, RefreshToken]
};

let app: Express;
let accessToken: string;
let client_id: string;
const username = `tester${Math.floor(Math.random() * 10000)}`;
const email = `${username}@example.com`;
const password = 'password';
const admin_password = process.env.ADMIN_PASSWORD || 'admin';

beforeAll(async () => {
  app = await createHttpServer({
    rootAdmin: process.env.ADMIN,
    rootAdminPassword: process.env.ADMIN_PASSWORD,
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
    modelOptions: {
      accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
      refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET
    }
  });
});

afterAll(async () => new Promise(done => setTimeout(() => done(), 500)));

describe('Authenticate Tests', () => {
  it('should create RootClient', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: { admin: 'admin', password: 'admin_test' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        client_id = data.createRootClient;
        expect(typeof data.createRootClient).toBe('string');
      }));

  it('should register new (admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Register',
        query: REGISTER_ADMIN,
        variables: { email, password, username, admin_password }
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
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        accessToken = data.login.accessToken;
        expect(data?.login?.ok).toBeTruthy();
        expect(typeof data.login.accessToken).toBe('string');
        expect(data?.login?.user?.email).toEqual(email);
        expect(data?.login?.user?.username).toEqual(username);
      }));

  it('should fail to authenticate request without token', async () =>
    request(app)
      .post('/oauth/authenticate')
      .expect(({ body }) => {
        expect(body.ok).toBeFalsy();
        expect(body.authenticated).toBeFalsy();
        expect(body.message).toEqual(UNAUTHORIZED_REQUEST);
      }));

  it('should authenticate request', async () =>
    request(app)
      .post('/oauth/authenticate')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(({ body }) => {
        expect(body.ok).toBeTruthy();
        expect(body.authenticated).toBeTruthy();
        expect(typeof body.user_id).toEqual('string');
      }));
});
