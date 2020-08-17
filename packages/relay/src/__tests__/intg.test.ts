import fetch from 'node-fetch';
import { EndPoints, processPbocEtcEntity } from '../pbocEtc';
import { createRelayService } from '../relayService';
import { ReqRes } from '../reqres';
import { createSnifferService, ProcessResults } from '../snifferService';
import { createMockServer, getTestData } from './mockUtils';

const host = '127.0.0.1';
const port = 6379;
const mockPort = 4323;
const sniffPort = 2503;
const relayPort = 2502;
const stamp = Date.now();
const topic = `intg-test${stamp}`;
const mockCallback = jest.fn();

let data;

let stopMock: () => Promise<number>;
let stopRelay: () => Promise<number>;
let stopSniff: () => Promise<number>;

beforeAll(async () => {
  const { sniffer, shutdown: shutSniff } = await createSnifferService({
    redisHost: host, redisPort: port,
    topic, callback: (channel: string, message: ReqRes, messageStr?: string): void => {
      if (message) {
        const result = processPbocEtcEntity(message);
        mockCallback(result);
      } else if (messageStr) {
        console.log(`Incoming message with invalid format: '${messageStr}'`);
      } else {
        console.log('Incoming message missing');
      }
    }
  });
  stopSniff = shutSniff;

  const { relay, shutdown: shutRelay } = await createRelayService({
    targetUrl: `http://localhost:${mockPort}`,
    redisHost: host, redisPort: port,
    topic, httpsArg: 'http'
  });
  stopRelay = shutRelay;

  const { server, shutdown } = createMockServer(true, true);
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
  await stopMock();
  await stopRelay();
  await stopSniff();
  return new Promise(resolve => setTimeout(() => {
    console.log('Integration tests finished', topic);
    resolve();
  }, 1000));
});

describe('PO tests', () => {
  let expectResultCount = 0;
  const results: ProcessResults[] = [];

  beforeAll(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockCallback.mockImplementation((result) => {
      results.push(result);
    });
    data = getTestData('501');
  });

  it('create POs', async () => { // case 0
    await fetch(`http://localhost:${relayPort}${EndPoints[1]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoCreate)
    }).then(res => {
      console.log('create POs', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('edit POs', async () => { // case 1
    await fetch(`http://localhost:${relayPort}${EndPoints[1]}`, {
      method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoEdit)
    }).then(res => {
      console.log('edit POs', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('cancel POs', async () => { // case 2
    await fetch(`http://localhost:${relayPort}${EndPoints[2]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoCancel)
    }).then(res => {
      console.log('cancel POs', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('process POs', async () => { // case 3
    await fetch(`http://localhost:${relayPort}${EndPoints[3]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoProcess)
    }).then(res => {
      console.log('process POs', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('create Invoices', async () => { // case 4
    await fetch(`http://localhost:${relayPort}${EndPoints[4]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvCreate)
    }).then(res => {
      console.log('create Invoices', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('edit Invoices', async () => { // case 5
    await fetch(`http://localhost:${relayPort}${EndPoints[4]}`, {
      method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvEdit)
    }).then(res => {
      console.log('edit Invoices', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('notify Invoices', async () => { // case 6
    await fetch(`http://localhost:${relayPort}${EndPoints[5]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvNotify)
    }).then(res => {
      console.log('notify Invoices', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('invoices results', async () => { // case 7
    await fetch(`http://localhost:${relayPort}${EndPoints[7]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvResult)
    }).then(res => {
      console.log('invoices results', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('finance results', async () => { // case 8
    await fetch(`http://localhost:${relayPort}${EndPoints[8]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvFin)
    }).then(res => {
      console.log('finance results', res.status, res.statusText);
      expectResultCount ++;
      expect(res.status).toEqual(200);
    });
  });

  it('wait for sniffed results', async () => {
    let count = 10;
    while ((results.length !== expectResultCount) && count > 0) {
      count --;
      console.log('Waiting...', count);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    expect(results.length).toEqual(expectResultCount);

    for (let i = 0; i < results.length; i ++) {
      const { statusMessage, reqBody, resBody, errors, ...rest } = results[i];
      switch (i) {
        case 0:
          expect(results[i].method === 'POST');
          expect(results[i].events.length).toEqual(data.PoCreate.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('POCreated');
            expect(results[i].events[j].payload.poBaseInfo.poId).toEqual(data.PoCreate[j].poBaseInfo.poId);
          }
          break;

        case 1:
          expect(results[i].method === 'PUT');
          expect(results[i].events.length).toEqual(data.PoEdit.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('POUpdated');
            expect(results[i].events[j].payload.poBaseInfo.poId).toEqual(data.PoEdit[j].poBaseInfo.poId);
          }
          break;

        case 2:
          expect(results[i].method === 'POST');
          expect(results[i].events.length).toEqual(data.PoCancel.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('POCancelled');
            expect(results[i].events[j].payload.poId).toEqual(data.PoCreate[j+2].poBaseInfo.poId);
          }
          break;

        case 3:
          expect(results[i].method === 'POST');
          expect(results[i].events.length).toEqual(data.PoProcess.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('POProcessed');
            expect(results[i].events[j].payload.poId).toEqual(data.PoCreate[j].poBaseInfo.poId);
          }
          break;

        case 4:
          expect(results[i].method === 'POST');
          expect(results[i].events.length).toEqual(data.InvCreate.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('InvoiceCreated');
            expect(results[i].events[j].payload.invBaseInfo.invoiceId).toEqual(data.InvCreate[j].invBaseInfo.invoiceId);
          }
          break;

        case 5:
          expect(results[i].method === 'PUT');
          expect(results[i].events.length).toEqual(data.InvEdit.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('InvoiceUpdated');
            expect(results[i].events[j].payload.invBaseInfo.invoiceId).toEqual(data.InvEdit[j].invBaseInfo.invoiceId);
          }
          break;

        case 6:
          expect(results[i].method === 'POST');
          expect(results[i].events.length).toEqual(data.InvNotify.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('InvoiceNotified');
            expect(results[i].events[j].payload.poId).toEqual(data.PoCreate[j].poBaseInfo.poId);
          }
          break;

        case 7:
          expect(results[i].method === 'POST');
          expect(results[i].events.length).toEqual(data.InvResult.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('InvoiceResponded');
            expect(results[i].events[j].payload.invoiceId).toEqual(data.InvCreate[j].invBaseInfo.invoiceId);
          }
          break;

        case 8:
          expect(results[i].method === 'POST');
          expect(results[i].events.length).toEqual(data.InvFin.length);
          for (let j = 0; j < results[i].events.length; j ++) {
            expect(results[i].events[j].type).toEqual('PaymentStatusNotified');
            expect(results[i].events[j].payload.invoiceId).toEqual(data.InvCreate[j].invBaseInfo.invoiceId);
          }
          break;
      }
    }

    // See https://stackoverflow.com/questions/25344879/uploading-file-using-post-request-in-node-js
    // EDIT: but the npm module 'request' is deprecated!
    // it('create a PO with files', async () => {});
  });
});
