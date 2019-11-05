import { ApolloServer } from 'apollo-server';
import { Express } from 'express';
import request from 'supertest';
import { User } from '../entity/User';
import '../env';
import { HELLO, LOGIN, REGISTER, USERS } from '../query';
import { UserResolver } from '../resolvers';
import { createHttpServer } from '../utils';

// https://github.com/rtang03/open-platform/tree/master/packages/doc-etc/src/user/query

const connection = {
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
  entities: [User]
};

let app: Express;

beforeAll(async () => {
  app = await createHttpServer({
    connection,
    resolvers: [UserResolver]
  });
});

// this is workaround for unfinished handler issue with jest and supertest
afterAll(async () => new Promise(done => setTimeout(() => done(), 500)));

describe('Authentication Tests', () => {
  it('should response the GET method, /', async () =>
    request(app)
      .get('/')
      .then(({ body }) => expect(body).toEqual({ data: 'hello' })));

  it('should query Hello', async () =>
    request(app)
      .post('/graphql')
      .send({ operationName: 'Hello', query: HELLO })
      .expect(({ body: { data } }) => expect(data).toEqual({ hello: 'hi!' })));

  it('should query users', async () =>
    request(app)
      .post('/graphql')
      .send({ operationName: 'users', query: USERS })
      .expect(({ body: { data } }) => expect(data).toEqual({ users: [] })));

  it('should register new user', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'register',
        query: REGISTER,
        variables: { email: 'tester@example.com', password: 'password' }
      })
      .expect(({ body: { data } }) =>
        expect(data).toEqual({ register: true })
      ));

  it('should login', async () =>
    request(app)
      .post('/graphql')
      .send({
        operationName: 'login',
        query: LOGIN,
        variables: { email: 'tester@example.com', password: 'password' }
      })
      .expect(({ body: { data } }) =>
        expect(data!.login!.accessToken).toBeDefined()
      ));
});
