require('dotenv').config();
import express from 'express';
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

let app: express.Express;
let user_id: string;
let client_id: string;
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

    app = await createHttpServer({ connection });

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

describe('Auth server Tests', () => {
  it('should say Hi', async () =>
    request(app)
      .get('/')
      .expect(({ body }) => expect(body).toEqual({ data: 'Hello' })));

  it('should register user', async () =>
    request(app)
      .post('/register')
      .send({ username: 'tester01', password: 'password01', email: 'tester01@example.com' })
      .expect(({ body }) => {
        expect(body?.username).toEqual('tester01');
        expect(!!body?.id).toBeTruthy();
      }));

  it('should fail to register user', async () =>
    request(app)
      .post('/register')
      .send({ username: 'tester02', email: 'tester01@example.com' })
      .expect(({ body }) =>
        expect(body?.error).toEqual('req body should take the form { username, password, email }')
      ));

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

  it('should fail to login user with bad password', async () =>
    request(app)
      .post('/login')
      .send({ username: 'tester01', password: 'bad password' })
      .expect(({ body }) => expect(body?.error).toEqual('Incorrect Username / Password')));

  it('should create client', async () =>
    request(app)
      .post('/client')
      .send({ application_name: 'first_app', client_secret: 'password', user_id })
      .expect(({ body }) => {
        client_id = body.id;
        expect(body.application_name).toEqual('first_app');
        expect(!!body?.id).toBeTruthy();
      }));

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

  // it('should authenticate via access_token', async () =>
  //   request(app)
  //     .get('/api/userinfo')
  //     .set('authorization', `Bearer ${access_token}`)
  //     .expect(({ body, error }) => {
  //       console.log(body);
  //       console.log(error);
  //     }));

  /*
  it('should return profile', async () =>
    request(app)
      .post('/profile')
      .expect(({ body }) => {
        console.log(body);
      }));



   */
});
