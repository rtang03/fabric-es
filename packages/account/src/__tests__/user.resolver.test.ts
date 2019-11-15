import { Express } from 'express';
import { omit } from 'lodash';
import request from 'supertest';
import { OUser } from '../entity/OUser';
import '../env';
import {
  BYE,
  CA_IDENTITIES,
  CA_IDENTITY,
  HELLO,
  LOGIN,
  LOGOUT,
  ME,
  REGISTER,
  USERS
} from '../query';
import { AdminResolver, OUserResolver } from '../resolvers';
import { createHttpServer } from '../utils';

// https://github.com/rtang03/open-platform/tree/master/packages/doc-etc/src/user/query

const dbConnection = {
  name: 'default',
  type: 'postgres' as any,
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'testdatabase',
  logging: false,
  synchronize: true,
  dropSchema: true,
  entities: [OUser]
};

let app: Express;
let accessToken: string;
const email = `tester${Math.floor(Math.random() * 10000)}@example.com`;
const password = 'password';

beforeAll(async () => {
  app = await createHttpServer({
    dbConnection,
    resolvers: [OUserResolver],
  });
});

// this is workaround for unfinished handler issue with jest and supertest
afterAll(async () => new Promise(done => setTimeout(() => done(), 500)));

describe('User Resolver Tests', () => {
  it('should query Hello', async () =>
    request(app)
      .post('/graphql')
      .send({ operationName: 'Hello', query: HELLO })
      .expect(({ body: { data } }) => expect(data).toEqual({ hello: 'hi!' })));

  // it('should query users', async () =>
  //   request(app)
  //     .post('/graphql')
  //     .send({ operationName: 'users', query: USERS })
  //     .expect(({ body: { data } }) => expect(data).toEqual({ users: [] })));
  //
  // it('should register new user', async () =>
  //   request(app)
  //     .post('/graphql')
  //     .send({
  //       operationName: 'register',
  //       query: REGISTER,
  //       variables: { email, password }
  //     })
  //     .expect(({ body: { data } }) =>
  //       expect(data).toEqual({ register: true })
  //     ));
  //
  // it('should login', async () =>
  //   request(app)
  //     .post('/graphql')
  //     .send({
  //       operationName: 'login',
  //       query: LOGIN,
  //       variables: { email, password }
  //     })
  //     .expect(({ body: { data } }) => {
  //       accessToken = data!.login!.access_token;
  //       expect(data!.login!.access_token).toBeDefined();
  //     }));
  //
  // it('should get myProfile', async () =>
  //   request(app)
  //     .post('/graphql')
  //     .set('authorization', `Bearer ${accessToken}`)
  //     .send({ operationName: 'me', query: ME })
  //     .expect(({ body: { data: { me } } }) =>
  //       expect(omit(me, 'attrs', 'affiliation')).toEqual({
  //         id: email,
  //         email,
  //         type: 'client',
  //         caname: 'ca.org1.example.com',
  //         max_enrollments: -1
  //       })
  //     ));
  //
  // it('should fail to get myProfile', async () =>
  //   request(app)
  //     .post('/graphql')
  //     .set('authorization', `Bearer 123456789`)
  //     .send({ operationName: 'me', query: ME })
  //     .expect(({ body: { data, errors } }) =>
  //       expect(data).toEqual({ me: null })
  //     ));
  //
  // it('should bye', async () =>
  //   request(app)
  //     .post('/graphql')
  //     .set('authorization', `Bearer ${accessToken}`)
  //     .send({ operationName: 'bye', query: BYE })
  //     .expect(({ body: { data } }) =>
  //       expect(data).toEqual({ bye: 'your user id is: 1' })
  //     ));
  //
  // it('should logout', async () =>
  //   request(app)
  //     .post('/graphql')
  //     .send({ operationName: 'logout', query: LOGOUT })
  //     .expect(({ body: { data } }) => expect(data).toEqual({ logout: true })));
});
