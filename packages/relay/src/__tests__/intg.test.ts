import mockyeah from 'mockyeah';
const request = require('supertest');
const { relayApp, relayServer } = require('../app');

afterAll(async () => {
  await mockyeah.close();
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
});

describe('Relay service', () => {

  afterEach(() => {
    relayServer.close();
  });

  it('should return 200 for get', async () => {
    const path: string = '/hello-world';
    mockyeah.get(path, { json: { hello: 'world' } });
    await request(relayApp).get(path).expect(200, { hello: 'world' });
  });

  it('should return 404 for put', async () => {
    const path: string = '/resource-not-found';
    mockyeah.put(path, { status: 404 });
    await request(relayApp).put(path).expect(404);
  });

  it('should return 500 for post', async () => {
    const path: string = '/server-error';
    mockyeah.put(path, { status: 500 });
    await request(relayApp).put(path).expect(500);
  });
  
});
