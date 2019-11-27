import { Express } from 'express';
import request from 'supertest';
import { AccessToken } from '../entity/AccessToken';
import { AuthorizationCode } from '../entity/AuthorizationCode';
import { Client } from '../entity/Client';
import { OUser } from '../entity/OUser';
import { RefreshToken } from '../entity/RefreshToken';
import '../env';
import {
  CREATE_ROOT_CLIENT,
  LOGIN,
  ME,
  REGISTER_ADMIN,
  REGISTER_USER,
  UPDATE_USER,
  USERS
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
  database: 'testpassword',
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

// this is workaround for unfinished handler issue with jest and supertest
afterAll(async () => new Promise(done => setTimeout(() => done(), 500)));

describe('Password Grant Type Tests', () => {
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
        expect(data.createRootClient).toBeDefined();
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
      .expect(({ body: { data }, header }) => {
        // refreshToken = header['set-cookie'][0].split('; ')[0].split('=')[1];
        accessToken = data.login.accessToken;
        expect(data.login.ok).toBeTruthy();
        expect(data.login.accessToken).toBeDefined();
        expect(data.login.user.email).toEqual(email);
        expect(data.login.user.username).toEqual(username);
      }));

  it('should fail to query users, (unauthenticated)', async () =>
    request(app)
      .post('/graphql')
      .send({ operationName: 'Users', query: USERS })
      .expect(({ body: { errors } }) =>
        expect(errors[0].message).toEqual('could not find user')
      ));

  it('should query users, (authenticated admin)', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({ operationName: 'Users', query: USERS })
      .expect(({ body: { data, errors } }) => {
        expect(data.users[0].email).toEqual(email);
        expect(data.users[0].username).toEqual(username);
      }));

  it('should get myProfile', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({ operationName: 'Me', query: ME })
      .expect(({ body: { data } }) => {
        expect(data.me.email).toEqual(email);
        expect(data.me.username).toEqual(username);
      }));

  it('should fail to get myProfile', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `Bearer 123456789`)
      .send({ operationName: 'Me', query: ME })
      .expect(({ body }) => expect(body.data.me).toBeNull()));

  // update-user is a pre-requisite of next test: register (non-admin) user
  // coz the email/username is inserted again.
  it('should update user', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'UpdateUser',
        query: UPDATE_USER,
        variables: { email: 'changed@example.com', username: 'changed_user' }
      })
      .expect(({ body }) => expect(body.data.updateUser).toBeTruthy()));

  it('should register (non-admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Register',
        query: REGISTER_USER,
        variables: { email, password, username }
      })
      .expect(({ body }) => expect(body.data.register).toBeTruthy()));

  it('should login (non-admin) user', async () =>
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
        expect(data.login.accessToken).toBeDefined();
        expect(data.login.user.email).toEqual(email);
        expect(data.login.user.username).toEqual(username);
      }));

  it('should fail to query all users with non-admin user', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({ operationName: 'Users', query: USERS })
      .expect(({ body: { errors } }) => {
        expect(errors[0].message).toEqual('require admin privilege');
      }));

  it('should fail to login non-exist user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Login',
        query: LOGIN,
        variables: { email: 'faker@example.com', password }
      })
      .expect(({ body: { errors } }) =>
        expect(errors[0].message).toEqual('cannot find user')
      ));
});
