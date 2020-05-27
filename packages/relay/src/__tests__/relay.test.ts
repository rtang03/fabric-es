import { runSimple } from 'run-container'
import redis from 'redis';
import retryStrategy from 'node-redis-retry-strategy';
import { processMsg } from '../processMsg';
import { ReqRes } from '../reqres';

const msg: ReqRes = { 
  id: 'myId', 
  startTime: 0, 
  duration: 2, 
  method: 'patch', 
  url: 'myurl',
  reqBody: 'myBody',
  statusCode: 3, 
  statusMessage: 'myMsg' };
const rHost = '127.0.0.1';
const rPort = 6379;
const channel = 'test-channel';
let publisher: redis.RedisClient;
let subscriber: redis.RedisClient;
let redisContainer;

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

  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
});

afterAll( async () => {
  publisher.quit();
  subscriber.quit();
  await redisContainer.remove({ force: true });
  
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
});

describe('Process Message', () => {

  it('should reject undefined or null message', (done) => {
    const f = () => { processMsg(undefined, publisher, channel) };
    expect(f).toThrow();
    done();
  });

  it('should reject undefined or null client', (done) => {
    const f = () => { processMsg(msg, null, channel) };
    expect(f).toThrow();
    done();
  });

  it('should reject empty string topic', (done) => {
    const f = () => { processMsg(msg, publisher, '') };
    expect(f).toThrow();
    done();
  });

  it('should be the same message object for pub and sub', (done) => {

    subscriber.on('message', (channel, message) => {
      const subObj: ReqRes = JSON.parse(message);
      console.log(`message received: ${JSON.stringify(subObj)}`);
      expect(subObj).toEqual(msg);
      done();
    });
    processMsg(msg, publisher, channel);
  });

});
