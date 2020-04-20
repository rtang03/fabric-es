require('dotenv').config();
import express from 'express';
import httpStatus from 'http-status';
import omit from 'lodash/omit';
import request from 'supertest';
import { createHttpServer } from '../createHttpServer';
import { AccessToken } from '../entity/AccessToken';
import { Client } from '../entity/Client';
import { User } from '../entity/User';
import { createDbForUnitTest } from './__utils__/createDbForUnitTest';

const connection = {
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
  entities: [AccessToken, Client, User]
};
const org_admin_secret = process.env.ORG_ADMIN_SECRET;

let app: express.Express;
let user_id: string;
let client_id: string;
let non_root_client_id: string;
let access_token: string;

beforeAll(async () => {
  try {
    await createDbForUnitTest({
      database: process.env.TYPEORM_DATABASE,
      host: process.env.TYPEORM_HOST,
      port: process.env.TYPEORM_PORT,
      user: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD
    });

    app = await createHttpServer({
      connection,
      jwtSecret: process.env.JWT_SECRET,
      expiryInSeconds: parseInt(process.env.JWT_EXP_IN_SECOND, 10),
      orgAdminSecret: process.env.ORG_ADMIN_SECRET
    });

    const user = User.create({
      email: 'tester@example.com',
      username: 'tester',
      password: 'password',
      is_admin: false
    });
    await User.insert(user);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => new Promise(done => setTimeout(() => done(), 10)));

describe('Auth Tests - / and /account', () => {
  it('should say Hi', async () =>
    request(app)
      .get('/')
      .expect(({ body }) => expect(body).toEqual({ data: 'Hello' })));

  it('should fail to register user', async () =>
    request(app)
      .post('/account')
      .send({ username: 'tester02', email: 'tester01@example.com' })
      .expect(({ body }) =>
        expect(body?.error).toEqual('req body should take the form { username, password, email }')
      ));

  it('should register (org admin) user', async () =>
    request(app)
      .post('/account')
      .send({ username: 'tester01', password: 'password01', email: 'tester01@example.com', org_admin_secret })
      .expect(({ body }) => {
        expect(body?.username).toEqual('tester01');
        expect(!!body?.id).toBeTruthy();
      }));

  it('should fail to login user with bad password', async () =>
    request(app)
      .post('/login')
      .send({ username: 'tester01', password: 'bad password' })
      .expect(({ body }) => expect(body?.error).toEqual('Incorrect Username / Password')));

  it('should login user', async () =>
    request(app)
      .post('/login')
      .send({ username: 'tester01', password: 'password01' })
      .expect(({ body, header }) => {
        user_id = body.id;
        access_token = body.access_token;
        expect(!!body?.id).toBeTruthy();
        expect(!!header['set-cookie']).toBeTruthy();
      }));
});

describe('Auth Tests - /client', () => {
  it('should fail to create client without application_name', async () =>
    request(app)
      .post('/client')
      .set('authorization', `Bearer ${access_token}`)
      .send({ client_secret: 'password' })
      .expect(({ status, body }) => {
        expect(status).toEqual(httpStatus.BAD_REQUEST);
        expect(body.error).toEqual('application_name, client_secret is required');
      }));

  it('should fail to create client without client_secret', async () =>
    request(app)
      .post('/client')
      .set('authorization', `Bearer ${access_token}`)
      .send({ application_name: 'root' })
      .expect(({ status, body }) => {
        expect(status).toEqual(httpStatus.BAD_REQUEST);
        expect(body.error).toEqual('application_name, client_secret is required');
      }));

  it('should fail to create client without access token', async () =>
    request(app)
      .post('/client')
      .send({ application_name: 'root', client_secret: 'password', is_system_app: true })
      .expect(({ status }) => expect(status).toEqual(httpStatus.UNAUTHORIZED)));

  it('should create client', async () =>
    request(app)
      .post('/client')
      .set('authorization', `Bearer ${access_token}`)
      .send({ application_name: 'root', client_secret: 'password', is_system_app: true })
      .expect(({ body }) => {
        client_id = body.id;
        expect(body.application_name).toEqual('root');
        expect(!!body?.id).toBeTruthy();
        expect(body.ok).toBeTruthy();
      }));

  it('should fail to list client, without access token', async () =>
    request(app)
      .get('/client')
      .expect(({ status }) => expect(status).toEqual(httpStatus.UNAUTHORIZED)));

  it('should list all client', async () =>
    request(app)
      .get('/client')
      .set('authorization', `Bearer ${access_token}`)
      .expect(({ body }) => {
        const client: Client = body[0];
        expect(typeof client.id).toEqual('string');
        expect(client.application_name).toEqual('root');
        expect(client.is_system_app).toBeTruthy();
        expect(client.user_id).toEqual(user_id);
      }));

  it('should fail to search root client', async () =>
    request(app)
      .get('/client?application_name=nope')
      .set('authorization', `Bearer ${access_token}`)
      .expect(({ body }) => expect(body).toEqual({})));

  it('should search root client by application_name', async () =>
    request(app)
      .get('/client?application_name=root')
      .set('authorization', `Bearer ${access_token}`)
      .expect(({ body }) => {
        const client: Client = body;
        expect(typeof client.id).toEqual('string');
        expect(client.application_name).toEqual('root');
        expect(client.is_system_app).toBeTruthy();
        expect(client.user_id).toEqual(user_id);
      }));

  it('should fail to get root client by RESTful path', async () =>
    request(app)
      .get(`/client/abcdefg`)
      .set('authorization', `Bearer ${access_token}`)
      .expect(({ body }) => expect(body.error).toEqual('fail to retrieve client')));

  it('should get root client by RESTful path', async () =>
    request(app)
      .get(`/client/${client_id}`)
      .set('authorization', `Bearer ${access_token}`)
      .expect(({ body }) => {
        const client: Client = body;
        expect(typeof client.id).toEqual('string');
        expect(client.application_name).toEqual('root');
        expect(client.is_system_app).toBeTruthy();
        expect(client.user_id).toEqual(user_id);
      }));

  it('should create non-root client', async () =>
    request(app)
      .post('/client')
      .set('authorization', `Bearer ${access_token}`)
      .send({
        application_name: 'firstapp',
        client_secret: 'password',
        redirect_uris: ['http://example.com'],
        grants: ['password']
      })
      .expect(({ body }) => {
        non_root_client_id = body.id;
        expect(body.application_name).toEqual('firstapp');
        expect(!!body?.id).toBeTruthy();
        expect(body.ok).toBeTruthy();
      }));

  it('should update client', async () =>
    request(app)
      .put(`/client/${non_root_client_id}`)
      .set('authorization', `Bearer ${access_token}`)
      .send({
        application_name: 'updatedapp',
        redirect_uris: ['http://example.com/callback'],
        grants: ['password', 'implicit']
      })
      .expect(({ body }) => {
        expect(body.ok).toBeTruthy();
        expect(body.application_name).toEqual('updatedapp');
        expect(body.redirect_uris).toEqual(['http://example.com/callback']);
        expect(body.grants).toEqual(['password', 'implicit']);
      }));

  it('should delete client', async () =>
    request(app)
      .delete(`/client/${non_root_client_id}`)
      .set('authorization', `Bearer ${access_token}`)
      .expect(({ body }) => expect(body.ok).toBeTruthy()));
});

describe('Auth Tests - /api', () => {
  it('should fail to retrieve user profile with invalid token', async () =>
    request(app)
      .get('/api/userinfo')
      .set('authorization', `Bearer NO-TOKEN`)
      .expect(({ error }) => {
        expect((error as any).status).toEqual(401);
      }));

  it('should retrieve user profile via access_token', async () =>
    request(app)
      .get('/api/userinfo')
      .set('authorization', `Bearer ${access_token}`)
      .expect(({ body }) => {
        expect(omit(body, 'id')).toEqual({
          email: 'tester01@example.com',
          username: 'tester01',
          is_admin: false
        });
      }));
});

describe('Auth Tests - /oauth', () => {
  // it('should fail to authenticate', async () => request(app));
  // it('should authenticate', async () => request(app));

  it('should exchange token with client_credential', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(`client_id=${client_id}&client_secret=password&grant_type=client_credentials&scope=default`)
      .expect(({ body }) => {
        expect(typeof body?.access_token).toEqual('string');
        expect(body?.token_type).toEqual('Bearer');
      }));

  it('should fail to exchange token with client_credential', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(`client_id=${client_id}&client_secret=badpassword&grant_type=client_credentials&scope=default`)
      .expect(({ body }) => expect(body).toEqual({})));

  it('should exchange access_token with uid/pw', async () =>
    request(app)
      .post('/oauth/token')
      .set('Context-Type', 'application/x-www-form-urlencoded')
      .send(`client_id=${client_id}&client_secret=password&username=tester01&password=password01&grant_type=password`)
      .expect(({ body }) => {
        expect(typeof body?.access_token).toEqual('string');
        expect(body?.token_type).toEqual('Bearer');
      }));
});
