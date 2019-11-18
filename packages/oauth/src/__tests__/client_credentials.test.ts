import { Express } from 'express';
import request from 'supertest';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import '../env';
import {
  CREATE_APPLICATION,
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
  database: 'testclientcredentials',
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
const username = `tester${Math.floor(Math.random() * 10000)}`;
const email = `${username}@example.com`;
const password = 'password';
const admin_password = process.env.ADMIN_PASSWORD || 'admin';
const applicationName = 'testApp';
const redirect_uri = 'optional';
const grants = ['client_credentials', 'password', 'refresh_token'];

beforeAll(async () => {
  app = await createHttpServer({
    dbConnection,
    resolvers: [OUserResolver, ClientResolver],
    oauthOptions: {
      requireClientAuthentication: {
        password: false,
        refresh_token: false,
        client_credentials: true
      },
      accessTokenLifetime: 120, // seconds
      refreshTokenLifetime: 240
    }
  });
});

// this is workaround for unfinished handler issue with jest and supertest
afterAll(async () => new Promise(done => setTimeout(() => done(), 500)));

describe('Client Credentials Grant Type Tests', () => {
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
        expect(data.login.ok).toBe(true);
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
        query: CREATE_APPLICATION,
        variables: { applicationName, grants }
      })
      .expect(({ body: { data } }) => {
        client_id = data.createApplication.client_id;
        client_secret = data.createApplication.client_secret;
        expect(data.createApplication.ok).toEqual(true);
        expect(data.createApplication.redirect_uri).toEqual(null);
      }));

  it('should /oauth/token', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials&scope=default`
      )
      .expect(({ body }) => {
        expect(body.ok).toEqual(true);
        expect(body.token.client.id).toEqual(client_id);
      }));
});
