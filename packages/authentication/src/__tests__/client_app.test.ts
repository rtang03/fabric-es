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
import {
  CREATE_APP_FOR_AUTHCODE,
  CREATE_REGULAR_APP,
  CREATE_ROOT_CLIENT,
  DELETE_REGULAR_APP,
  GET_CLIENTS,
  GET_PUBLIC_CLIENTS,
  LOGIN,
  REGISTER_ADMIN,
  REGISTER_USER,
  UPDATE_REGULAR_APP,
  UPDATE_USER
} from '../query';
import { ClientResolver, OUserResolver } from '../resolvers';
import {
  ADMIN_PASSWORD_MISMATCH,
  ALREADY_EXIST,
  AUTH_HEADER_ERROR,
  BAD_PASSWORD,
  CLIENT_NOT_FOUND,
  USER_NOT_FOUND
} from '../types';
import { createHttpServer } from '../utils';

let app: Express;
let client_id: string;
let accessToken: string;
let client_secret: string;
const randomId = Math.floor(Math.random() * 10000);
const username = `tester_admin${randomId}`;
const email = `${username}@example.com`;
const password = 'password';
const admin_password = process.env.ADMIN_PASSWORD || 'admin';
const applicationName = 'testApp';
const grants = ['client_credentials', 'authorization_code', 'refresh_token'];
const redirect_uri = 'http://example.com/callback';
const regularUsername = `tester_regular${randomId}`;
const regularEmail = `${regularUsername}@example.com`;
const dbConnection = {
  name: 'default',
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'docker',
  database: 'testclientapp',
  logging: false,
  synchronize: true,
  dropSchema: true,
  entities: [OUser, Client, AccessToken, AuthorizationCode, RefreshToken]
};

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

describe('Client app Tests', () => {
  it('should fail to create RootClient', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'CreateRootClient',
        query: CREATE_ROOT_CLIENT,
        variables: { admin: 'admin', password: 'wrong_password' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.createRooClient).toBeUndefined();
        expect(errors[0].message).toEqual(ADMIN_PASSWORD_MISMATCH);
      }));

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
        client_id = data?.createRootClient;
        expect(data?.createRootClient).toBeDefined();
      }));

  it('should fail to register new (admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Register',
        query: REGISTER_ADMIN,
        variables: { email, password, username, admin_password: 'wrong pw' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.register).toBeUndefined();
        expect(errors[0].message).toEqual(ADMIN_PASSWORD_MISMATCH);
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

  it('should fail to register new (admin) user again', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Register',
        query: REGISTER_ADMIN,
        variables: { email, password, username, admin_password }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.register).toBeUndefined();
        expect(errors[0].message).toEqual(ALREADY_EXIST);
      }));

  it('should fail to login new (admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Login',
        query: LOGIN,
        variables: { email, password: 'wrong password' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.login).toBeUndefined();
        expect(errors[0].message).toEqual(BAD_PASSWORD);
      }));

  it('should fail to create application client, by admin', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'CreateApplication',
        query: CREATE_APP_FOR_AUTHCODE,
        variables: { applicationName, grants, redirect_uri }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.createApplication).toBeNull();
        expect(errors[0].message).toEqual(USER_NOT_FOUND);
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
        expect(data?.login?.accessToken).toBeDefined();
        expect(data?.login?.user?.email).toEqual(email);
        expect(data?.login?.user?.username).toEqual(username);
      }));

  it('should create application client, by admin', async () =>
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
        client_id = data?.createApplication?.client_id;
        client_secret = data?.createApplication?.client_secret;
        expect(data?.createApplication?.ok).toEqual(true);
        expect(data?.createApplication?.redirect_uri).toEqual(redirect_uri);
      }));

  it('should query public client directory', async () =>
    request(app)
      .post('/graphql')
      .send({ operation: 'GetPublicClients', query: GET_PUBLIC_CLIENTS })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        const clients: Client[] = data.getPublicClients;
        expect(clients?.length).toEqual(2);
        expect(clients[0]?.applicationName).toEqual('root');
        expect(clients[1]?.applicationName).toEqual(applicationName);
      }));

  it('should register (non-admin) user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Register',
        query: REGISTER_USER,
        variables: { email: regularEmail, username: regularUsername, password }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.register).toBeTruthy();
      }));

  it('should fail to register (non-admin) user again', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Register',
        query: REGISTER_USER,
        variables: { email: regularEmail, username: regularUsername, password }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.register).toBeUndefined();
        expect(errors[0].message).toEqual(ALREADY_EXIST);
      }));

  it('should login regular user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'Login',
        query: LOGIN,
        variables: { email: regularEmail, password }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        accessToken = data.login.accessToken;
        expect(data?.login?.ok).toBeTruthy();
        expect(data?.login?.accessToken).toBeDefined();
        expect(data?.login?.user.email).toEqual(regularEmail);
        expect(data?.login?.user.username).toEqual(regularUsername);
      }));

  it('should create application client, by regular user', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'CreateRegularApp',
        query: CREATE_REGULAR_APP,
        variables: { applicationName: 'newClientApp', grants, redirect_uri }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        const result = data.createRegularApp;
        client_id = result.client_id;
        client_secret = result.client_secret;
        expect(result?.ok).toEqual(true);
        expect(result?.redirect_uri).toEqual(redirect_uri);
      }));

  it('should query public client directory', async () =>
    request(app)
      .post('/graphql')
      .send({ operation: 'GetPublicClients', query: GET_PUBLIC_CLIENTS })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        const clients: Client[] = data.getPublicClients;
        expect(clients?.length).toEqual(3);
        expect(clients[0]?.applicationName).toEqual('root');
        expect(clients[1]?.applicationName).toEqual('testApp');
        expect(clients[2]?.applicationName).toEqual('newClientApp');
      }));

  it('should query my newly created client', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({ operation: 'GetClients', query: GET_CLIENTS })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        const clients: Client[] = data.getClients;
        expect(clients?.length).toEqual(1);
        expect(clients[0]?.applicationName).toEqual('newClientApp');
      }));

  it('should fail to update regular client app, with wrong client_id', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operation: 'UpdateRegularApp',
        query: UPDATE_REGULAR_APP,
        variables: { client_id: 'wrong id', applicationName: 'changed-name' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.updateRegularApp).toBeUndefined();
        expect(errors[0].message).toEqual(CLIENT_NOT_FOUND);
      }));

  it('should update regular client app: applicationName', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operation: 'UpdateRegularApp',
        query: UPDATE_REGULAR_APP,
        variables: { client_id, applicationName: 'changed-name' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.updateRegularApp).toBeTruthy();
      }));

  it('should update regular client app: redirect_uri', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operation: 'UpdateRegularApp',
        query: UPDATE_REGULAR_APP,
        variables: {
          client_id,
          redirect_uri: 'http://changed.example.com/callback'
        }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.updateRegularApp).toBeTruthy();
      }));

  it('should fail to delete client', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operation: 'DeleteClient',
        query: DELETE_REGULAR_APP,
        variables: { client_id: 'wrong id' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.deleteRegularApp).toBeUndefined();
        expect(errors[0].message).toEqual(CLIENT_NOT_FOUND);
      }));

  it('should delete client', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operation: 'DeleteClient',
        query: DELETE_REGULAR_APP,
        variables: { client_id }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.deleteRegularApp).toBeTruthy();
      }));

  it('should fail to update user: wrong token', async () =>
    request(app)
      .post('/graphql')
      .send({
        operation: 'UpdateUser',
        query: UPDATE_USER,
        variables: { email: 'new_email@example.com' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(data?.updateUser).toBeUndefined();
        expect(errors[0].message).toEqual(AUTH_HEADER_ERROR);
      }));

  it('should update user: email', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operation: 'UpdateUser',
        query: UPDATE_USER,
        variables: { email: 'changed_email@example.com' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.updateUser).toBeTruthy();
      }));

  it('should update user: username', async () =>
    request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operation: 'UpdateUser',
        query: UPDATE_USER,
        variables: { username: 'changed-name' }
      })
      .expect(({ body: { data, errors } }) => {
        expect(errors).toBeUndefined();
        expect(data?.updateUser).toBeTruthy();
      }));
});
