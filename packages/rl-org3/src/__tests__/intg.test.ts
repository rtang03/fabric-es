import { getReducer, Repository } from '@fabric-es/fabric-cqrs';
import {
  EndPoints, getPbocEtcEntityProcessor, Invoice, InvoiceEvents, invoiceReducer, PO, PoEvents, poReducer
} from '@fabric-es/model-pboc';
import {
  createMockServer, createRelayService, createSnifferService, getEntityProcessor, getTestData
} from '@fabric-es/relay-lib';
import { Wallets } from 'fabric-network';
import RedisClient, { Redis, RedisOptions } from 'ioredis';
import fetch from 'node-fetch';

const host = '127.0.0.1';
const port = 6379;
const mockPort = 4323;
const sniffPort = 2531;
const relayPort = 2530;
const stamp = Date.now();
const topic = `intg-test${stamp}`;
// const mockCallback = jest.fn();

let data;
let stopMock: () => Promise<number>;
let stopRelay: () => Promise<void>;
let stopSniff: () => Promise<void>;
let cleanUp: () => Promise<void>;
let redisOptions: RedisOptions;

beforeAll(async () => {
  redisOptions = { host, port };
  const { getRepository, addRepository } = await getEntityProcessor({
    enrollmentId: 'admin-org3.net',
    channelName: 'loanapp',
    connectionProfile: 'connection/connection-org3.yaml',
    wallet: await Wallets.newFileSystemWallet('assets/wallet'),
    asLocalhost: true,
    redisOptions,
  });
  const { callback, cleanup } =
     addRepository(getRepository<PO, PoEvents>('po', getReducer<PO, PoEvents>(poReducer)))
    .addRepository(getRepository<Invoice, InvoiceEvents>('invoice', getReducer<Invoice, InvoiceEvents>(invoiceReducer)))
    .create(getPbocEtcEntityProcessor);

  cleanUp = cleanup;

  const { sniffer, shutdown: shutSniff } = await createSnifferService({
    redisOptions, topic, callback
  });
  stopSniff = shutSniff;

  const { relay, shutdown: shutRelay } = await createRelayService({
    redisOptions: { host, port },
    targetUrl: `http://localhost:${mockPort}`,
    topic, httpsArg: 'http'
  });
  stopRelay = shutRelay;

  const { server, shutdown } = createMockServer(null, null, true, true);
  stopMock = shutdown;

  sniffer.listen(sniffPort, () => {
    console.log(`🚀 sniffer ready at ${sniffPort}`);
  });

  relay.listen(relayPort, () => {
    console.log(`🚀 relay ready at ${relayPort}`);
  });

  server.listen(mockPort, () => {
    console.log(`🚀 mock server ready at ${mockPort}`);
  });
  await new Promise(resolve => setTimeout(resolve, 100));
});

afterAll(async () => {
  await cleanUp();
  await stopSniff();
  await stopMock();
  await stopRelay();
  return new Promise(resolve => setTimeout(() => {
    console.log('Integration tests finished', topic);
    resolve();
  }, 1000));
});

describe('PO tests', () => {
  beforeAll(() => {
    data = getTestData(`${stamp}`);
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 10000));
  });

  it('create POs', async () => { // case 0
    await fetch(`http://localhost:${relayPort}${EndPoints[1]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoCreate)
    }).then(res => {
      console.log('create POs', res.status, res.statusText);
      expect(res.status).toEqual(200);
    });
  });

  // it('wait for sniffed results', async () => {
  //   // let count = 10;
  //   // while ((results.length !== expectResultCount) && count > 0) {
  //   //   count --;
  //   //   console.log('Waiting...', count);
  //   //   await new Promise(resolve => setTimeout(resolve, 100));
  //   // }
  //   await new Promise(resolve => setTimeout(resolve, 10000));
  // });
});