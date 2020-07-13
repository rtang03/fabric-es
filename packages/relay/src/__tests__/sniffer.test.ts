import RedisClient, { Redis } from 'ioredis';
import mockyeah from 'mockyeah';
import { processMsg } from '../processMsg';
import { ReqRes } from '../reqres';
import { startSniffing } from '../startSniffing';

const INIT_MSG = 5;
const host = '127.0.0.1';
const port = 6379;
const mockInSniffer = jest.fn();
const stamp = Date.now();
const topic = `sniffer-test${stamp}`;
let publisher: Redis;
let subscriber: Redis;

/**
 * Use ...dev-net/dn-run.0-db-red.sh to start a redis instance at port 6379.
 */

beforeAll(async () => {
  publisher = new RedisClient({ host, port });

  const sources: ReqRes[] = [...new Array(5)].map((_, idx) => {
    return {
      id: `id00${idx}`, startTime: stamp + idx, duration: 5, method: 'patch',
      url: { url: `/test-url${idx}`, query: { k: `k${idx}`, v: `v${idx}` } },
      reqBody: { txt: `abc${idx}`, num: `123${idx}` }, resBody: '',
      statusCode: 3, statusMessage: `myMsg ${idx}`
    };
  });
  for (const mssg of sources) {
    await new Promise(resolve => setTimeout(resolve, 100));
    await processMsg({ message: mssg, client: publisher, topic });
  }
});

afterAll(async () => {
  publisher.quit();
  await mockyeah.close();
  return new Promise((resolve) => setTimeout(() => resolve(), 1000));
});

beforeEach(() => {
  subscriber = new RedisClient({ host, port });
});

afterEach(async () => {
  await subscriber.quit();
  jest.clearAllMocks();
  jest.resetAllMocks();
});

describe('Sniffer Service', () => {
  it('receiving messages published before and after subscription', async () => {
    const subscribe: ReqRes[] = [];
    mockInSniffer.mockImplementation((channel, message) => {
      if (message) subscribe.push(message);
    });

    const { read, count } = await startSniffing({ client: subscriber, topic, callback: mockInSniffer });
    expect(read).toEqual(INIT_MSG);
    expect(count).toEqual(1);

    const mssg = {
      id: `id999`, startTime: Date.now(), duration: 5, method: 'patch',
      url: { url: `/test-url999`, query: { k: `k999`, v: `v999` } },
      reqBody: { txt: `abc999`, num: `123999` }, resBody: '',
      statusCode: 3, statusMessage: `myMsg 999`
    };
    await processMsg({ message: mssg, client: publisher, topic });
    await new Promise((resolve) => setTimeout(() => resolve(), 100));

    expect(subscribe.length).toEqual(INIT_MSG + 1);
  });

  it('missing client', () => {
    expect(startSniffing({ client: null, topic })).rejects.toThrow();
  });

  it('missing topic', () => {
    expect(startSniffing({ client: subscriber, topic: undefined })).rejects.toThrow();
  });

  it('reusing subscriber', async () => {
    mockInSniffer.mockImplementation((channel, message) => {
      console.log(`Message ${message} received from channel ${channel}`);
    });
    const { read, count } = await startSniffing({ client: subscriber, topic: `thistopic${stamp}`, callback: mockInSniffer });
    expect(startSniffing({ client: subscriber, topic: `othertopics${stamp}`, callback: mockInSniffer })).rejects.toThrow();
  });

  it('receving message with unsupported format', async () => {
    const topic = `unsupported1${stamp}`;
    const subscribe: ReqRes[] = [];
    const wrongFrmt: string[] = [];
    mockInSniffer.mockImplementation((channel, message, messageStr) => {
      if (message) subscribe.push(message);
      if (messageStr) wrongFrmt.push(messageStr);
    });

    const { read, count } = await startSniffing({ client: subscriber, topic, callback: mockInSniffer });
    expect(read).toEqual(0);
    expect(count).toEqual(1);

    await publisher.publish(topic, 'This is an unsupported message format!!!');
    await publisher.publish(topic, '{"message": "This is a non-JSON message!!!"}');
    await new Promise((resolve) => setTimeout(() => resolve(), 100));

    expect(subscribe.length).toEqual(0);
    expect(wrongFrmt.length).toEqual(2);
  });

  it('receiving unsupported messages published before subscription', async () => {
    const topic = `unsupported2${stamp}`;
    // >>> Need to do this because processMsg only takes ReqRes type >>>
    await publisher.publish(topic, 'This is an unsupported message format!!!');
    await publisher.publish(topic, '{"message": "This is a non-JSON message!!!"}');
    await publisher.zadd(topic, Date.now(), 'This is an unsupported message format!!!');
    await publisher.zadd(topic, Date.now(), '{"message": "This is a non-JSON message!!!"}');
    // <<< Need to do this because processMsg only takes ReqRes type <<<
    await new Promise((resolve) => setTimeout(() => resolve(), 100));

    const subscribe: ReqRes[] = [];
    const wrongFrmt: string[] = [];
    mockInSniffer.mockImplementation((channel, message, messageStr) => {
      if (message) subscribe.push(message);
      if (messageStr) wrongFrmt.push(messageStr);
    });

    const { read, count } = await startSniffing({ client: subscriber, topic, callback: mockInSniffer });
    expect(read).toEqual(2);
    expect(count).toEqual(1);

    await publisher.publish(topic, '{"message": "This is another non-JSON message!!!"}');
    await new Promise((resolve) => setTimeout(() => resolve(), 100));

    expect(subscribe.length).toEqual(0);
    expect(wrongFrmt.length).toEqual(3);
  });
});
