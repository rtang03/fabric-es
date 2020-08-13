import { createRelayService } from '../relayService';
import { createSnifferService } from '../snifferService';
import { createMockServer } from './mockServer';

const host = '127.0.0.1';
const port = 6379;
const stamp = Date.now();
const topic = `sniffer-test${stamp}`;

let stopMock;
let stopRelay;
let stopSniffer;

beforeAll(async () => {
  const { server, shutdown: shutMock } = createMockServer();
  stopMock = shutMock;

  const { relay, shutdown: shutRelay } = await createRelayService({
    targetUrl: 'https://localhost:4323',
    redisHost: host, redisPort: port,
    topic, httpsArg: 'http'
  });
  stopRelay = shutRelay;

  const { sniffer, shutdown: shutSniff } = await createSnifferService({
    redisHost: host, redisPort: port,
    topic // , callback: getEntityProcessor(processPbocEtcEntity)
  });
  stopSniffer = shutSniff;

  server.listen(4323, () => {
    console.log(`🚀 mock server ready at 4323`);
  });

});

afterAll(async () => {
  await stopSniffer();
  await stopRelay();
  await stopMock();
});