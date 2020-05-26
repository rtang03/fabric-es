import { Dockest, logLevel } from 'dockest'
import redis from 'redis';
import retryStrategy from 'node-redis-retry-strategy';
import { processMsg } from '../processMsg';


const dockest = new Dockest()

const dockestServices = [
  {
    serviceName: 'myRedis', // Match with configuration in docker-compose.yml
  },
]

dockest.run(dockestServices)

const client = redis.createClient({host: REDIS_HOST, port: REDIS_PORT, retry_strategy: retryStrategy });


beforeAll(

);

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
