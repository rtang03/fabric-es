import { runSimple } from 'run-container'
import redis, { RedisClient } from 'redis';
import mockyeah from 'mockyeah';
import retryStrategy from 'node-redis-retry-strategy';
import { processMsg } from '../processMsg';
import { ReqRes } from '../reqres';
import { relayService } from '../relayService';
import request from 'supertest';
import { AssertionError } from 'assert';

const msg: ReqRes = {
  id: 'myId',
  startTime: 0,
  duration: 2,
  method: 'patch',
  url: { url: '/test-url', query: { k1: 'v1', k2: 'v2' } },
  reqBody: { key1: 'abc', key2: '123' },
  statusCode: 3,
  statusMessage: 'myMsg'
};
const rHost = '127.0.0.1';
const rPort = 6379;
let publisher: RedisClient;
let subscriber1: RedisClient, subscriber2: RedisClient, objectEqualitySubscriber: RedisClient;
let redisContainer;
let relay;

beforeAll(async () => {
  // Start Redis
  redisContainer = await runSimple({
    image: 'redis',
    name: 'redis-in-jest',
    ports: { '6379': '6379' }
  });

  // Sit for 3s
  await new Promise(resolve => setTimeout(resolve, 3000));

  publisher = redis.createClient({ host: rHost, port: rPort, retry_strategy: retryStrategy });
  subscriber1 = redis.createClient({ host: rHost, port: rPort, retry_strategy: retryStrategy });
  subscriber2 = redis.createClient({ host: rHost, port: rPort, retry_strategy: retryStrategy });
  objectEqualitySubscriber = redis.createClient({ host: rHost, port: rPort, retry_strategy: retryStrategy });
  relay = relayService({ targetUrl: 'http://localhost:4001', client: publisher, topic: 'relay-channel' });

  subscriber1.on('message', (channel, message) => {
    console.log(`subscriber1 listening ${channel}: ${message}`);
  });

  subscriber2.on('message', (channel, message) => {
    console.log(`subscriber2 listening ${channel}: ${message}`);
  });

  objectEqualitySubscriber.on('message', (channel, message) => {
    const subObj: ReqRes = JSON.parse(message);
    console.log(`listening ${channel}: ${JSON.stringify(subObj)}`);
    expect(subObj).toEqual(msg);
  });
});

afterAll(async () => {
  await mockyeah.close();
  publisher.quit();
  subscriber1.quit();
  subscriber2.quit();
  objectEqualitySubscriber.quit();
  await redisContainer.remove({ force: true });
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
});

describe('Process Message', () => {

  it('should reject undefined or null message', () => {
    expect(processMsg({ message: undefined, client: publisher, topic: 'rejection' })).rejects.toThrow();
  });

  it('should reject undefined or null client', () => {
    expect(processMsg({ message: msg, client: null, topic: 'rejection' })).rejects.toThrow();
  });

  it('should reject empty string topic', () => {
    expect(processMsg({ message: msg, client: publisher, topic: '' })).rejects.toThrow();
  });

  it('should publish with no subscriber', async () => {
    await processMsg({ message: msg, client: publisher, topic: '0 subscriber' })
      .then((numOfSub) => {
        expect(numOfSub).toEqual(0);
      });
  });

  it('should publish with 2 subscribers', async () => {
    const topic = '2 subscribers';
    subscriber1.subscribe(topic);
    subscriber2.subscribe(topic);
    await processMsg({ message: msg, client: publisher, topic: topic })
      .then((numOfSub) => {
        expect(numOfSub).toEqual(2);
      });
  });

  it('should receive same object on subscribed channel', async () => {
    const topic = 'same obj';
    objectEqualitySubscriber.subscribe(topic);
    await processMsg({ message: msg, client: publisher, topic: topic });
  });

});

describe('Relay Service', () => {

  it('should reject undefined or null url', () => {
    const f = () => { relayService({targetUrl: undefined, client: publisher, topic: 'rejection'}); }; 
    expect(f).toThrow();
  });

  it('should reject undefined or null client', () => {
    const f = () => { relayService({targetUrl: 'http://localhost:4001', client: null, topic: 'rejection'}); };
    expect(f).toThrow();
  });

  it('should reject undefined, null or empty string topic', () => {
    const f = () => { relayService({targetUrl: 'http://localhost:4001', client: publisher, topic: null}); };
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

  it('should match message object for pub and sub with json body', async () => {

    subscriber.on('message', async (channel, message) => {
      const subObj: ReqRes = JSON.parse(message);
      console.log(`message received: ${JSON.stringify(subObj)}`);
      expect(subObj).toMatchObject({ method: "POST", reqBody: body, statusCode: 204, url: { url: '/pub-sub', query: { abc: '123', def: '456' } } });
    });

    const path = '/pub-sub?abc=123&def=456';
    const body = { id: '1234' };
    mockyeah.post(path, { status: 204, json: req => req.body });
    await request(relay).post(path)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(204);
 });

//   it('should receive 400 when post text when content-type json', async () => {

//     const path = '/pub-sub?abc=123&def=456';
//     const body = 'I am a text';
//     mockyeah.post(path, { status: 204, text: req => req.body });
//     await request(relay).post(path)
//       .send(body)
//       .set('Content-Type', 'application/json')
//       .set('Accept', 'application/json')
//       .expect(400);
//   });

});