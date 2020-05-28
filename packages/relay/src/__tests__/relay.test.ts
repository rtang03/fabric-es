import { runSimple } from 'run-container'
import redis from 'redis';
import mockyeah from 'mockyeah';
import retryStrategy from 'node-redis-retry-strategy';
import { processMsg } from '../processMsg';
import { ReqRes } from '../reqres';
import { relayService } from '../relayService';
import { resolveSoa } from 'dns';
const request = require('supertest');

const msg: ReqRes = { 
  id: 'myId', 
  startTime: 0, 
  duration: 2, 
  method: 'patch', 
  url: 'myurl',
  reqBody: {key1: 'abc', key2: '123'},
  statusCode: 3, 
  statusMessage: 'myMsg' };
const rHost = '127.0.0.1';
const rPort = 6379;
const channel = 'test-channel';
let publisher: redis.RedisClient;
let subscriber: redis.RedisClient;
let redisContainer;
let relay;

beforeAll(async () => {
  // Start Redis
  redisContainer = await runSimple({
    image: 'redis',
    name: 'redis-in-jest',
    ports: { '6379' : '6379' }
  });

  // Sit for 3s
  await new Promise(resolve => setTimeout(resolve, 3000));

  publisher = redis.createClient({host: rHost, port: rPort, retry_strategy: retryStrategy });
  subscriber = redis.createClient({host: rHost, port: rPort});
  subscriber.subscribe(channel);
  relay = relayService({targetUrl: 'http://localhost:4001', client: publisher, topic: channel});

  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
});

afterAll( async () => {
  await mockyeah.close();
  publisher.quit();
  subscriber.quit();
  await redisContainer.remove({ force: true });
  
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
});

describe('Process Message', () => {

  it('should reject undefined or null message', () => {
    const f = () => { processMsg({message: undefined, client: publisher, topic: channel}) };
    expect(f).toThrow();
  });

  it('should reject undefined or null client', () => {
    const f = () => { processMsg({message: msg, client: null, topic: channel}) };
    expect(f).toThrow();
  });

  it('should reject empty string topic', () => {
    const f = () => { processMsg({message: msg, client: publisher, topic: ''}) };
    expect(f).toThrow();
  });

  it('should be the same message object for pub and sub', async () => {

    const thePromise = () => {
      return new Promise((resolve, reject) => {
        subscriber.on('message', async (channel, message) => {
          const subObj: ReqRes = JSON.parse(message);
          console.log(`message received: ${JSON.stringify(subObj)}`);
          resolve(subObj);
        });
      });
    }
    processMsg({ message: msg, client: publisher, topic: channel });
    expect(await thePromise()).toEqual(msg);
  });

});

describe('Relay Service', () => {

  it('should reject undefined or null url', () => {
    const f = () => { relayService({targetUrl: undefined, client: publisher, topic: channel}) };
    expect(f).toThrow();
  });

  it('should reject undefined or null client', () => {
    const f = () => { relayService({targetUrl: 'http://localhost:4001', client: null, topic: channel}) };
    expect(f).toThrow();
  });

  it('should reject undefined, null or empty string topic', () => {
    const f = () => { relayService({targetUrl: 'http://localhost:4001', client: publisher, topic: null}) };
    expect(f).toThrow();
  });

  it('should return 404 when endpoint is missing', async () => {
    const path: string = '/no-endpoint';
    await request(relay).get(path).expect(404);
  }); 

  it('should return 404 for put', async () => {
    const path: string = '/resource-not-found';
    mockyeah.put(path, { status: 404 });
    await request(relay).put(path).expect(404);
  });

  it('should return 204 for delete', async () => {
    const path: string = '/delete-me';
    mockyeah.put(path, { status: 204 });
    await request(relay).put(path).expect(204);
  });

  it('should return 500 for post', async () => {
    const path: string = '/server-error';
    mockyeah.put(path, { status: 500 });
    await request(relay).put(path).expect(500);
  });

  it('should return 200 for get', async () => {
    const path: string = '/hello-world';
    mockyeah.get(path, { status: 200, json: { hello: 'world' } });
    await request(relay).get(path).expect(200, { hello: 'world' });
  });

  it('should match message object for pub and sub', async () => {

    const thePromise = () => {
      return new Promise((resolve, reject) => {
        subscriber.on('message', async (channel, message) => {
          const subObj: ReqRes = JSON.parse(message);
          console.log(`message received: ${JSON.stringify(subObj)}`);
          resolve(subObj);
        });
      });
    }
    const path: string = '/pub-sub?abc=123';
    const body: Object = {id: '1234'};
    mockyeah.post(path, { status: 200 });
    await request(relay).post(path).expect(200);
    expect(await thePromise()).toMatchObject({method: "POST", reqBody: {}, statusCode: 200, url: {url: '/pub-sub', query: {abc: '123'}}});
  });

});