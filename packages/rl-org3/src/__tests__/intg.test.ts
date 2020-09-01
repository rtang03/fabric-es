import { getReducer } from '@fabric-es/fabric-cqrs';
import { createQueryHandlerService } from '@fabric-es/gateway-lib';
import {
  EndPoints, getPbocEtcEntityProcessor, Invoice, InvoiceEvents, invoiceReducer, PO, PoEvents, poReducer
} from '@fabric-es/model-pboc';
import {
  createMockServer, createRelayService, createSnifferService, getEntityProcessor, getTestData
} from '@fabric-es/relay-lib';
import { Wallets } from 'fabric-network';
import { RedisOptions } from 'ioredis';
import fetch from 'node-fetch';

const QUERY = {
  'FullTextSearchEntity': `
  query FullTextSearchEntity($query: String!) {
    fullTextSearchEntity (query: $query) {
      items {
        id
        entityName
        value
        events
        desc
        tag
        creator
        timeline
      }
    }
  }`
};

const host = '127.0.0.1';
const port = 6379;
const mockPort = 4323;
const sniffPort = 2531;
const relayPort = 2530;
const queryPort = 5503;
const stamp = Date.now();
const topic = `intg-test${stamp}`;
const enrollmentId = 'admin-org3.net';
// const mockCallback = jest.fn();

let data;
let stopMock: () => Promise<number>;
let stopQuery: () => Promise<void>;
let stopRelay: () => Promise<void>;
let stopSniff: () => Promise<void>;
let cleanUp: () => Promise<void>;
let redisOptions: RedisOptions;

beforeAll(async () => {
  redisOptions = { host, port };
  const { getRepository, addRepository } = await getEntityProcessor({
    enrollmentId,
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

  const reducers = {
    po: getReducer<PO, PoEvents>(poReducer),
    invoice: getReducer<Invoice, InvoiceEvents>(invoiceReducer)
  };
  const { server: query, shutdown: shutQuery } = await createQueryHandlerService(
    ['po', 'invoice'],
    {
      redisOptions,
      asLocalhost: true,
      channelName: 'loanapp',
      connectionProfile: 'connection/connection-org3.yaml',
      enrollmentId,
      reducers,
      wallet: await Wallets.newFileSystemWallet('assets/wallet'),
      authCheck: 'http://localhost:3003/oauth/authenticate',
    }
  );
  stopQuery = shutQuery;

  const { server: mock, shutdown } = createMockServer(null, null, true, true);
  stopMock = shutdown;

  sniffer.listen(sniffPort, () => {
    console.log(`🚀 sniffer ready at ${sniffPort}`);
  });

  relay.listen(relayPort, () => {
    console.log(`🚀 relay ready at ${relayPort}`);
  });

  query.listen(queryPort, () => {
    console.log(`🚀 query handler ready at ${queryPort}`);
  });

  mock.listen(mockPort, () => {
    console.log(`🚀 mock server ready at ${mockPort}`);
  });
  await new Promise(resolve => setTimeout(resolve, 100));

  data = getTestData(`${stamp}`);
});

afterAll(async () => {
  await cleanUp();
  await stopSniff();
  await stopQuery();
  await stopRelay();
  await stopMock();
  return new Promise(resolve => setTimeout(() => {
    console.log('Integration tests finished', topic);
    resolve();
  }, 1000));
});

let poIds: string[];
let editedPoId: string;
let cancelledPoIds: string[];

describe('PO tests', () => {
  it('create POs', async () => { // case 0
    await fetch(`http://localhost:${relayPort}${EndPoints[1]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoCreate)
    }).then(res => {
      expect(res.status).toEqual(200);
      poIds = data.PoCreate.map(d => d.poBaseInfo.poId);
    });
  });

  it('edit POs', async () => { // case 0
    await fetch(`http://localhost:${relayPort}${EndPoints[1]}`, {
      method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoEdit)
    }).then(res => {
      expect(res.status).toEqual(200);
      editedPoId = data.PoEdit[0].poBaseInfo.poId;
    });
  });

  it('cancel POs', async () => { // case 0
    await fetch(`http://localhost:${relayPort}${EndPoints[2]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoCancel)
    }).then(res => {
      expect(res.status).toEqual(200);
      cancelledPoIds = data.PoCancel.map(d => d.poId);
    });
  });

  it('process POs', async () => { // case 0
    await fetch(`http://localhost:${relayPort}${EndPoints[3]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.PoProcess)
    }).then(res => {
      expect(res.status).toEqual(200);
    });
  });
});

let invIds: string[];
let editedInvId: string;
let notifiedInvId: string[];

describe('Invoice tests', () => {
  it('create Invoices', async () => {
    await fetch(`http://localhost:${relayPort}${EndPoints[4]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvCreate)
    }).then(res => {
      expect(res.status).toEqual(200);
      invIds = data.InvCreate.map(d => d.invBaseInfo.invoiceId);
    });
  });

  it('edit Invoices', async () => {
    await fetch(`http://localhost:${relayPort}${EndPoints[4]}`, {
      method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvEdit)
    }).then(res => {
      expect(res.status).toEqual(200);
      editedInvId = data.InvEdit[0].invBaseInfo.invoiceId;
    });
  });

  it('notify Invoices', async () => { // case 6
    await fetch(`http://localhost:${relayPort}${EndPoints[5]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvNotify)
    }).then(res => {
      expect(res.status).toEqual(200);
      notifiedInvId = data.InvNotify.map(d => d.invoices[0].invoiceId);
    });
  });

  it('invoices results', async () => { // case 7
    await fetch(`http://localhost:${relayPort}${EndPoints[7]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvResult)
    }).then(res => {
      expect(res.status).toEqual(200);
    });
  });

  it('finance results', async () => { // case 8
    await fetch(`http://localhost:${relayPort}${EndPoints[8]}`, {
      method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(data.InvFin)
    }).then(res => {
      expect(res.status).toEqual(200);
    });
  });
});

describe('Read from Fabric', () => {
  const password = 'p@ssw0rd';
  const userId3 = 'USER_ORG3';
  const user3 =   `u3${stamp}@org.example.com`;
  let accessToken;

  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 50000)); // Allow time for sniffer to run

    const { reg3, rol3 } = await fetch('http://localhost:3003/account', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username: user3, email: user3, password
      })})
    .then(res => res.json())
    .then(data => {
      if (data.username && data.id) {
        return { reg3: true, rol3: data.id };
      } else {
        console.log(`Register Org3 user: ${JSON.stringify(data)}`);
        return { reg3: false, rol3: null };
      }
    });
    if (!reg3) {
      console.log(`♨️♨️  Registering to OAUTH server localhost:3003 failed`);
      return;
    }
    // Login Org3 user
    const { log3, tok3 } = await fetch('http://localhost:3003/account/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username: user3, password
      })})
    .then(res => res.json())
    .then(data => {
      if (data.id === rol3) {
        return { log3: true, tok3: data.access_token };
      } else {
        console.log(`Login Org3 user: ${JSON.stringify(data)}`);
        return { log3: false, tok3: null };
      }
    });
    if (!log3) {
      console.log(`♨️♨️  Logging in to OAUTH server localhost:3003 as ${user3} / ${password} failed`);
      return;
    }
    accessToken = tok3;
  });

  it('read created POs', async () => {
    if (accessToken) {
      for (const id of poIds) {
        await fetch(`http://localhost:${queryPort}/graphql`, {
          method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken}` }, body: JSON.stringify({
            operationName: 'FullTextSearchEntity', query: QUERY['FullTextSearchEntity'], variables: { query: id }
          })})
        .then(res => res.json())
        .then(({ data }) => {
          expect(JSON.stringify(data).indexOf(`\\"poNo\\":\\"PO${stamp}`)).toBeGreaterThanOrEqual(0);
          if (cancelledPoIds.includes(id)) {
            expect(JSON.stringify(data).indexOf(`\\"status\\":4`)).toBeGreaterThanOrEqual(0);
          } else if (id.endsWith('5')) {
            expect(JSON.stringify(data).indexOf(`\\"status\\":3`)).toBeGreaterThanOrEqual(0);
          } else {
            expect(JSON.stringify(data).indexOf(`\\"status\\":2`)).toBeGreaterThanOrEqual(0);
          }
        })
        .catch(_ => expect(false).toBeTruthy());
      }
    } else
      expect(false).toBeTruthy();
  });

  it('read edited POs', async () => {
    if (accessToken) {
      await fetch(`http://localhost:${queryPort}/graphql`, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken}` }, body: JSON.stringify({
          operationName: 'FullTextSearchEntity', query: QUERY['FullTextSearchEntity'], variables: { query: editedPoId }
        })})
      .then(res => res.json())
      // .then(data => {
      //   console.log('INTG TEST', JSON.stringify(data, null, ' '));
      //   return data;
      // })
      .then(({ data }) => expect(JSON.stringify(data).indexOf(`EDITED`)).toBeGreaterThanOrEqual(0))
      .catch(_ => expect(false).toBeTruthy());
    } else
      expect(false).toBeTruthy();
  });

  it('read created Invoices', async () => {
    if (accessToken) {
      for (const id of invIds) {
        await fetch(`http://localhost:${queryPort}/graphql`, {
          method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken}` }, body: JSON.stringify({
            operationName: 'FullTextSearchEntity', query: QUERY['FullTextSearchEntity'], variables: { query: id }
          })})
        .then(res => res.json())
        .then(data => {
          console.log('HEHEHEHEHEHEHE', JSON.stringify(data, null, ' '));
          return data;
        })
        .then(({ data }) => {
          expect(JSON.stringify(data).indexOf(`\\"invoiceNo\\":\\"INV${stamp}`)).toBeGreaterThanOrEqual(0);
          if (notifiedInvId.includes(id)) {
            expect(JSON.stringify(data).indexOf(`\\"financeNo\\":\\"F12345${stamp}`)).toBeGreaterThanOrEqual(0);
          }
          expect(JSON.stringify(data).indexOf(`\\"status\\":2`)).toBeGreaterThanOrEqual(0);
          expect(JSON.stringify(data).indexOf(`\\"paymentAmount\\":\\"12345`)).toBeGreaterThanOrEqual(0);
        })
        .catch(_ => expect(false).toBeTruthy());
      }
    } else
      expect(false).toBeTruthy();
  });

  it('read edited Invoices', async () => {
    if (accessToken) {
      await fetch(`http://localhost:${queryPort}/graphql`, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken}` }, body: JSON.stringify({
          operationName: 'FullTextSearchEntity', query: QUERY['FullTextSearchEntity'], variables: { query: editedInvId }
        })})
      .then(res => res.json())
      .then(({ data }) => expect(JSON.stringify(data).indexOf(`EDITED`)).toBeGreaterThanOrEqual(0))
      .catch(_ => expect(false).toBeTruthy());
    } else
      expect(false).toBeTruthy();
  });

});
