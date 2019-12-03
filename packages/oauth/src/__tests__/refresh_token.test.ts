require('../env');
import { Express } from 'express';
import request from 'supertest';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import { CREATE_ROOT_CLIENT, REGISTER_ADMIN } from '../query';
import { ClientResolver,OUserResolver } from '../resolvers';
import { createHttpServer } from '../utils';

const dbConnection = {
  name: 'default',
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'testrefreshtoken',
  logging: false,
  synchronize: true,
  dropSchema: true,
  entities: [OUser, Client, AccessToken, AuthorizationCode, RefreshToken]
};

let app: Express;
let refreshToken: string;
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
      requireClientAuthentication: { password: false, refresh_token: false },
      accessTokenLifetime: 5, // seconds
      refreshTokenLifetime: 10
    }
  });
});

// this is workaround for unfinished handler issue with jest and supertest
afterAll(async () => new Promise(done => setTimeout(() => done(), 15000)));

describe('Refresh Token Grant Type Tests', () => {
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
      .expect(({ body: { data } }) => {
        client_id = data.createRootClient;
        expect(data.createRootClient).toBeDefined();
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
          admin_password
        }
      })
      .expect(({ body }) => expect(body.data.register).toBeTruthy()));

  it('should /oauth/token', async () => {
    await request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(
        `client_id=${client_id}&grant_type=password&username=${username}&password=${password}&scope=default`
      )
      .expect(({ body }) => {
        console.log(body.token.accessTokenExpiresAt);
        refreshToken = body.token.refreshToken;
        expect(body.ok).toBeTruthy();
        expect(body.token.client.id).toEqual(client_id);
      });

    // refresh token, before accessToken expires
    setTimeout(
      async () =>
        await request(app)
          .post('/oauth/refresh_token')
          .set('Context-Type', 'application/x-www-form-urlencoded')
          .send(
            `client_id=${client_id}&grant_type=refresh_token&scope=default&refresh_token=${refreshToken}`
          )
          .expect(({ body }) => {
            console.log(body.token.accessTokenExpiresAt);
            expect(body.ok).toBeTruthy();
          }),
      3000
    );

    // refresh token, after refreshToken expires
    setTimeout(
      async () =>
        await request(app)
          .post('/oauth/refresh_token')
          .set('Context-Type', 'application/x-www-form-urlencoded')
          .send(
            `client_id=${client_id}&grant_type=refresh_token&scope=default&refresh_token=${refreshToken}`
          )
          .expect(({ body }) =>
            expect(body).toEqual({
              ok: false,
              token: '',
              message: 'Invalid grant: refresh token is invalid'
            })
          ),
      11000
    );
  });
});
