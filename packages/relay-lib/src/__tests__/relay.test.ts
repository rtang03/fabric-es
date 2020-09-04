import express from 'express';
import RedisClient, { Redis } from 'ioredis';
import mockyeah from 'mockyeah';
import request from 'supertest';
import { processMessage } from '../processMsg';
import { relayService } from '../relayService';
import { ReqRes } from '../reqres';

const msg: ReqRes = {
  id: 'myId',
  proxyReqStarts: 0,
  proxyReqFinish: 1,
  proxyResStarts: 2,
  proxyResFinish: 3,
  method: 'patch',
  url: { url: '/test-url', query: { k1: 'v1', k2: 'v2' } },
  contentType: 'application/json',
  reqBody: { key1: 'abc', key2: '123' }, resBody: '',
  attachmentInfo: '',
  statusCode: 3,
  statusMessage: 'myMsg'
};
const host = '127.0.0.1';
const port = 6379;
const targetUrl = 'http://localhost:4321';
const mockInSubscriber1 = jest.fn();
const mockInSubscriber2 = jest.fn();
const relayChannel = 'relay-channel';
let publisher: Redis;
let publisher2: Redis;
let subscriber1: Redis;
let subscriber2: Redis;
let relay;

/**
 * Use ...dev-net/dn-run.0-db-red.sh to start a redis instance at port 6379.
 */

beforeAll(async () => {
  publisher = new RedisClient({ host, port });
  publisher2 = new RedisClient({ host, port });
  subscriber1 = new RedisClient({ host, port });
  subscriber2 = new RedisClient({ host, port });
  const proxy = relayService({ targetUrl, client: publisher, topic: relayChannel, isHttps: false });
  relay = express();
  relay.use('', proxy);

  subscriber1.on('message', (channel, message) => {
    console.log(`subscriber1 listening ${channel}: ${message}`);
    mockInSubscriber1(message);
  });

  subscriber2.on('message', (channel, message) => {
    console.log(`subscriber2 listening ${channel}: ${message}`);
    mockInSubscriber2(message);
  });
});

afterAll(async () => {
  await mockyeah.close();
  await subscriber2.quit();
  await subscriber1.quit();
  await publisher2.quit();
  await publisher.quit();
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
});

afterEach( () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

describe('Process Message', () => {
  it('should reject undefined or null message', () => {
    expect(processMessage({ message: undefined, client: publisher, topic: 'rejection' })).rejects.toThrow();
  });

  it('should reject undefined or null client', () => {
    expect(processMessage({ message: msg, client: null, topic: 'rejection' })).rejects.toThrow();
  });

  it('should reject empty string topic', () => {
    expect(processMessage({ message: msg, client: publisher, topic: '' })).rejects.toThrow();
  });

  it('should publish with no subscriber', async () => {
    await processMessage({ message: msg, client: publisher, topic: '0 subscriber' })
      .then((numOfSub) => {
        expect(numOfSub).toEqual(0);
      });
  });

  it('should publish with 2 subscribers', async () => {
    const topic = '2 subscribers';
    subscriber1.subscribe(topic);
    subscriber2.subscribe(topic);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await processMessage({ message: msg, client: publisher, topic })
      .then((numOfSub) => {
        expect(numOfSub).toEqual(0);
      });
  });

  // it('should receive same object on subscribed channel', async () => {
  //   const topic = 'same obj';
  //   mockInSubscriber1.mockImplementation((message) => {
  //     const subObj: ReqRes = JSON.parse(message);
  //     console.log(`Mock 1: ${JSON.stringify(subObj)}`);
  //     expect(subObj).toEqual(msg);
  //   });
  //   subscriber1.subscribe(topic);
  //   await processMessage({ message: msg, client: publisher, topic });
  // });
});

describe('Relay Service', () => {
  it('should reject undefined or null url', () => {
    const f = () => { relayService({targetUrl: undefined, client: publisher, topic: 'rejection', isHttps: false}); }; 
    expect(f).toThrow();
  });

  it('should reject undefined or null client', () => {
    const f = () => { relayService({targetUrl, client: null, topic: 'rejection', isHttps: false}); };
    expect(f).toThrow();
  });

  it('should reject undefined, null or empty string topic', () => {
    const f = () => { relayService({targetUrl, client: publisher, topic: null, isHttps: false}); };
    expect(f).toThrow();
  });

  it('should return 404 when endpoint is missing', async () => {
    const path = '/no-endpoint';
    await request(relay).get(path).expect(404);
  });

  it('should return 404 for put', async () => {
    const path = '/resource-not-found';
    mockyeah.put(path, { status: 404 });
    await request(relay).put(path).expect(404);
  });

  it('should return 204 for delete', async () => {
    const path = '/delete-me';
    mockyeah.put(path, { status: 204 });
    await request(relay).put(path).expect(204);
  });

  it('should return 500 for post', async () => {
    const path = '/server-error';
    mockyeah.put(path, { status: 500 });
    await request(relay).put(path).expect(500);
  });

  it('should return 200 for get', async () => {
    const path = '/hello-world';
    mockyeah.get(path, { status: 200, json: { hello: 'world' } });
    await request(relay).get(path).expect(200, { hello: 'world' });
  });

  // it('should match message object for pub and sub with json body', (done) => {
  //   mockInSubscriber2.mockImplementation(async (message: string) => {
  //     const msg = await publisher.xrange(relayChannel, message, message);
  //     console.log('OHOHOHOHOH', message, msg[1][1]);
  //     const subObj: ReqRes = JSON.parse(message);
  //     console.log(`Mock 2: ${JSON.stringify(subObj)}`);
  //     expect(subObj).toMatchObject({ method: 'POST', reqBody: body, statusCode: 204, url: { url: '/pub-sub', query: { abc: '123', def: '456' } } });
  //     done();
  //   });
  //   subscriber2.subscribe(relayChannel);

  //   const path = '/pub-sub?abc=123&def=456';
  //   const body = { id: '1234' };
  //   mockyeah.post(path, { status: 204, json: req => req.body });
  //   return new Promise(resolve => setTimeout(resolve, 1000)).then(() =>
  //     request(relay).post(path)
  //       .send(body)
  //       .set('Content-Type', 'application/json')
  //       .set('Accept', 'application/json'));
  // });

  it('should receive 400 when post text when content-type json', async () => {
    const path = '/pub-sub?abc=123&def=456';
    const body = 'I am a text';
    mockyeah.post(path, { status: 204, text: req => req.body });
    await request(relay).post(path)
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(400);
  });
});

describe('Pub / Sub', () => {
  it('stored records clean up properly', async () => {
    const RUNS = 10;
    const EXPT = 3;
    const topic = 'cleanup';
    const stamp = Date.now();
    const sources: ReqRes[] = [...new Array(RUNS)].map((_, idx) => {
      return {
        id: `id00${idx}`,
        proxyReqStarts: stamp + idx, proxyReqFinish: stamp + idx + 1,
        proxyResStarts: stamp + idx + 5, proxyResFinish: stamp + idx + 6,
        method: 'patch',
        url: { url: `/test-url${idx}`, query: { k: `k${idx}`, v: `v${idx}` } },
        contentType: 'application/json',
        reqBody: { txt: `abc${idx}`, num: `123${idx}` }, resBody: '',
        attachmentInfo: '',
        statusCode: 3, statusMessage: `myMsg ${idx}`
      };
    });

    const sub1 = [];
    mockInSubscriber1.mockImplementation((message) => {
      sub1.push(message);
    });
    subscriber1.subscribe(topic);

    for (const mssg of sources) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await processMessage({ message: mssg, client: publisher2, topic, ttl: 3000 });
    }

    const pubs = (await publisher2.xrange(topic, '-', '+')).map(str => JSON.parse(str[1][1]));
    for (let idx = 0; idx < pubs.length; idx ++) {
      expect(pubs[idx]).toEqual(sources[idx + RUNS - EXPT]);
    }
    expect(pubs.length).toEqual(EXPT);
  });

  it('subscription match records in REDIS', async () => {
    const topic = 'pubsub';
    const stamp = Date.now();
    const sources: ReqRes[] = [...new Array(5)].map((_, idx) => {
      return {
        id: `id00${idx}`,
        proxyReqStarts: stamp + idx, proxyReqFinish: stamp + idx + 1,
        proxyResStarts: stamp + idx + 5, proxyResFinish: stamp + idx + 6,
        method: 'patch',
        url: { url: `/test-url${idx}`, query: { k: `k${idx}`, v: `v${idx}` } },
        contentType: 'application/json',
        reqBody: { txt: `abc${idx}`, num: `123${idx}` }, resBody: '',
        attachmentInfo: '',
        statusCode: 3, statusMessage: `myMsg ${idx}`
      };
    });

    const sub1 = [];
    mockInSubscriber1.mockImplementation((message) => {
      sub1.push(message);
    });
    subscriber1.subscribe(topic);

    const sub2 = [];
    mockInSubscriber2.mockImplementation((message) => {
      sub2.push(message);
    });
    subscriber2.subscribe(topic);

    for (const mssg of sources) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await processMessage({ message: mssg, client: publisher2, topic });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    const pubs = (await publisher2.xrange(topic, stamp, '+')).map(str => str[0]); // JSON.parse(str[1][1]));
    for (let idx = 0; idx < pubs.length; idx ++) {
      expect(pubs[idx]).toEqual(sub1[idx]);
      expect(pubs[idx]).toEqual(sub2[idx]);
    }
  });

  it('subscription match each other', async () => {
    const topic = 'subs';
    const stamp = Date.now();
    const sources: ReqRes[] = [...new Array(5)].map((_, idx) => {
      return {
        id: `id00${idx}`,
        proxyReqStarts: stamp + idx, proxyReqFinish: stamp + idx + 1,
        proxyResStarts: stamp + idx + 5, proxyResFinish: stamp + idx + 6,
        method: 'patch',
        url: { url: `/test-url${idx}`, query: { k: `k${idx}`, v: `v${idx}` } },
        contentType: 'application/json',
        reqBody: { txt: `abc${idx}`, num: `123${idx}` }, resBody: '',
        attachmentInfo: '',
        statusCode: 3, statusMessage: `myMsg ${idx}`
      };
    });

    const sub1 = [];
    mockInSubscriber1.mockImplementation((message) => {
      sub1.push(message);
    });
    subscriber1.subscribe(topic);

    const sub2 = [];
    mockInSubscriber2.mockImplementation((message) => {
      sub2.push(message);
    });
    subscriber2.subscribe(topic);

    for (const mssg of sources) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await processMessage({ message: mssg, client: publisher2, topic });
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    for (let idx = 0; idx < sources.length; idx ++) {
      expect(sub1[idx]).toEqual(sub2[idx]);
    }
  });
});
