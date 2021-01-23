import RedisClient, { Redis } from 'ioredis';
import { processMessage } from '../processMsg';
import { ReqRes } from '../reqres';
import { createSubscription } from '../snifferSubscription';

const INIT_MSG = 5;
const host = '127.0.0.1';
const port = 6379;
const mockInSniffer = jest.fn();
const stamp = Date.now();
const topic = `sniffer-test${stamp}`;
let publisher: Redis;
let subscription: {
  start: (
    callback?: (topic: string, message: ReqRes, messageStr?: string) => Promise<void>
  ) => Promise<{ read: number; count: number }>;
  stop: () => Promise<void>;
};

const subscribe: ReqRes[] = [];
const wrongFrmt: string[] = [];

/**
 * Use ...dev-net/dn-run.0-db-red.sh to start a redis instance at port 6379.
 */

beforeAll(async () => {
  publisher = new RedisClient({ host, port });

  const sources: ReqRes[] = [...new Array(5)].map((_, idx) => {
    return {
      id: `id00${idx}`,
      proxyReqStarts: stamp + idx,
      proxyReqFinish: stamp + idx + 1,
      proxyResStarts: stamp + idx + 5,
      proxyResFinish: stamp + idx + 6,
      method: 'patch',
      url: { url: `/test-url${idx}`, query: { k: `k${idx}`, v: `v${idx}` } },
      contentType: 'application/json',
      reqBody: { txt: `abc${idx}`, num: `123${idx}` },
      resBody: '',
      attachmentInfo: '',
      statusCode: 3,
      statusMessage: `myMsg ${idx}`,
    };
  });
  for (const mssg of sources) {
    await processMessage({ message: mssg, client: publisher, topic });
  }

  const id1 = await publisher.xadd(
    topic,
    '*',
    'msg',
    'This is an existing unsupported message format!!!'
  );
  const id2 = await publisher.xadd(
    topic,
    '*',
    'msg',
    '{"message": "This is a existing non-JSON message!!!"}'
  );
  await publisher.publish(topic, id1);
  await publisher.publish(topic, id2);

  subscription = createSubscription(publisher, topic);

  mockInSniffer.mockImplementation((channel: string, message: ReqRes, messageStr: string) => {
    if (message) subscribe.push(message);
    if (messageStr) wrongFrmt.push(messageStr);
  });

  await new Promise((resolve) => setTimeout(resolve, 100));
});

afterAll(async () => {
  await subscription.stop();
  await publisher.quit();
  return new Promise<void>((ok) =>
    setTimeout(() => {
      console.log(
        topic,
        subscribe.map((s) => s.id)
      );
      ok();
    }, 1000)
  );
});

beforeEach(() => {
  while (subscribe.length > 0) subscribe.pop();
  while (wrongFrmt.length > 0) wrongFrmt.pop();
});

describe('Sniffer Service', () => {
  it('receiving messages published before and after subscription', async () => {
    const { read, count } = await subscription.start(mockInSniffer); // startSniffing({ client: subscriber, topic, callback: mockInSniffer });
    expect(read).toEqual(INIT_MSG);
    expect(count).toEqual(1);

    const mssg: ReqRes = {
      id: `id999`,
      proxyReqStarts: stamp,
      proxyReqFinish: stamp + 1,
      proxyResStarts: stamp + 5,
      proxyResFinish: stamp + 6,
      method: 'patch',
      url: { url: `/test-url999`, query: { k: `k999`, v: `v999` } },
      contentType: 'application/json',
      reqBody: { txt: `abc999`, num: `123999` },
      resBody: '',
      attachmentInfo: '',
      statusCode: 3,
      statusMessage: `myMsg 999`,
    };
    const result = await processMessage({ message: mssg, client: publisher, topic });
    expect(result).toBeGreaterThanOrEqual(0);
    await new Promise<void>((ok) => setTimeout(() => ok(), 150));

    expect(subscribe.length).toEqual(INIT_MSG + 1);
    expect(wrongFrmt.length).toEqual(2);
  });

  it('receving message with unsupported format', async () => {
    const id1 = await publisher.xadd(topic, '*', 'msg', 'This is an unsupported message format!!!');
    const id2 = await publisher.xadd(
      topic,
      '*',
      'msg',
      '{"message": "This is a non-JSON message!!!"}'
    );
    await publisher.publish(topic, id1);
    await publisher.publish(topic, id2);
    await new Promise<void>((ok) => setTimeout(() => ok(), 150));

    expect(subscribe.length).toEqual(0);
    expect(wrongFrmt.length).toEqual(2);
  });

  it('receiving messages from subscription', async () => {
    const sources: ReqRes[] = [...new Array(125)].map((_, idx) => {
      return {
        id: `id00${idx}`,
        proxyReqStarts: stamp + idx,
        proxyReqFinish: stamp + idx + 1,
        proxyResStarts: stamp + idx + 5,
        proxyResFinish: stamp + idx + 6,
        method: 'patch',
        url: { url: `/test-url${idx}`, query: { k: `k${idx}`, v: `v${idx}` } },
        contentType: 'application/json',
        reqBody: { txt: `abc${idx}`, num: `123${idx}` },
        resBody: '',
        attachmentInfo: '',
        statusCode: 3,
        statusMessage: `myMsg ${idx}`,
      };
    });
    for (const mssg of sources) {
      await processMessage({ message: mssg, client: publisher, topic });
    }
    await new Promise<void>((ok) => setTimeout(() => ok(), 150));
    expect(subscribe.length).toEqual(125);
  });
});
