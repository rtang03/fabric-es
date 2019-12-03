require('../env');
import { Express } from 'express';
import request from 'supertest';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import { CREATE_ROOT_CLIENT, LOGIN, REGISTER_ADMIN } from '../query';
import { ClientResolver, OUserResolver } from '../resolvers';
import { createHttpServer } from '../utils';

const dbConnection = {
  name: 'default',
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
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

afterAll(async () => new Promise(done => setTimeout(() => done(), 500)));

describe('Authenticate Tests', () => {
  it('should create RootClient', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: { admin: 'admin', password: 'admin' }
      })
      .expect(({ body: { data } }) => {
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
      .expect(({ body }) => expect(body.data.register).toBeTruthy()));

  it('should login new (admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Login',
        query: LOGIN,
        variables: { email, password }
      })
      .expect(({ body: { data } }) => {
        accessToken = data.login.accessToken;
        expect(data.login.ok).toBeTruthy();
        expect(typeof data.login.accessToken).toBe('string');
        expect(data.login.user.email).toEqual(email);
        expect(data.login.user.username).toEqual(username);
      }));

  it('should authenticate request', async () =>
    request(app)
      .post('/oauth/authenticate')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(({ body }) => {
        expect(body.ok).toEqual(true);
        expect(body.authenticated).toEqual(true);
        expect(typeof body.user_id).toEqual('string');
      }));
});
