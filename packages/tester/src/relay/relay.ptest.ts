require('dotenv').config({ path: './.env' });
import https from 'https';
import fetch from 'node-fetch';
import { getTestData, QUERY } from './mockUtils';

const EndPoints = [
  '/user/inquiry',                              // 0 GET ?sellerId=
  '/order/po',                                  // 1 POST; PUT; multipart/form-data ???
  '/order/cancelPO',                            // 2 POST
  '/etccorp/pboc/api/v1/po/process',            // 3 POST
  '/etccorp/pboc/api/v1/invoices',              // 4 POST; PUT; multipart/form-data ???
  '/etccorp/pboc/api/v1/invoices/notify',       // 5 POST; multipart/form-data ???
  '/etccorp/pboc/api/v1/invoices/image/upload', // 6 POST ?invoiceId= &imageDesc=; multipart/form-data ???
  '/invoice/result',                            // 7 POST
  '/trade-financing/invresult'                  // 8 POST
];
type EndPoints = typeof EndPoints[number];

const BATCH = parseInt(process.env.BATCH_NUM, 10) || 5; // Number of tests per run
const RUNS = parseInt(process.env.RUNS_NUM, 10) || 3; // Total number of runs
const RUNS_WAIT = parseInt(process.env.RUNS_WAIT, 10) || 30000; // Time to wait before sending the next batch of test (ms)
const READ_RETRY = parseInt(process.env.READ_RETRY, 10) || 20; // Number of retries to read expected results from Fabric
const READ_WAIT = parseInt(process.env.READ_WAIT, 10) || 3000; // Time to wait between each read retry
const athreg = `http://${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}/account`;
const athlog = `http://${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}/account/login`;
const relay1 = `https://${process.env.RELAY_HOST1}:${process.env.RELAY_PORT1}`; // ETC side
const relay2 = `https://${process.env.RELAY_HOST2}:${process.env.RELAY_PORT2}`; // PBOC side
const qryhdr = `http://${process.env.QUERY_HOST}:${process.env.QUERY_PORT}/graphql`; // FDI node

const range = Math.round(Math.log10(RUNS * BATCH)) + 1;
const stamp = Date.now();
const agent = new https.Agent({ rejectUnauthorized: false });

const authenticate = (username, email, password) => {
  return new Promise<string>(async (resolve, reject) => {
    const uid = await fetch(`${athreg}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username, email, password
      })})
    .then(res => res.json())
    .then(data => {
      if (data.username && data.id) {
        return data.id;
      } else {
        reject(`Register user failed: ${JSON.stringify(data)}`);
      }
    });

    if (uid !== undefined) {
      const token = await fetch(`${athlog}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
          username, password
        })})
      .then(res => res.json())
      .then(data => {
        if (data.id === uid) {
          return data.access_token;
        } else {
          reject(`Login Org3 user: ${JSON.stringify(data)}`);
        }
      });

      if (token !== undefined) resolve(token);
    }
  });
};

const createPo = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    const poIds = await fetch(`${relay2}${EndPoints[1]}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Create PO failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => d.poBaseInfo.poId);
      }
    });
    if (poIds !== undefined) resolve(poIds);
  });
};

const editPo = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    const editedPoIds = await fetch(`${relay2}${EndPoints[1]}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Edit PO failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => d.poBaseInfo.poId);
      }
    });
    if (editedPoIds !== undefined) resolve(editedPoIds);
  });
};

const cancelPo = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    const cancelledPoIds = await fetch(`${relay2}${EndPoints[2]}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Cancel PO failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => d.poId);
      }
    });
    if (cancelledPoIds !== undefined) resolve(cancelledPoIds);
  });
};

const processPo = (data) => {
  return new Promise<{
    poId: string;
    actionResponse: string;
  }[]>(async (resolve, reject) => {
    const processPoResult = await fetch(`${relay1}${EndPoints[3]}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Process PO failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => ({ poId: d.poId, actionResponse: d.actionResponse }));
      }
    });
    if (processPoResult !== undefined) resolve(processPoResult);
  });
};

const createInvoice = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    const invIds = await fetch(`${relay1}${EndPoints[4]}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Create Invoice failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => d.invBaseInfo.invoiceId);
      }
    });
    if (invIds !== undefined) resolve(invIds);
  });
};

const editInvoice = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    const editedInvIds = await fetch(`${relay1}${EndPoints[4]}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Edit Invoice failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => d.invBaseInfo.invoiceId);
      }
    });
    if (editedInvIds !== undefined) resolve(editedInvIds);
  });
};

const transferInvoice = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    const notifiedInvIds = await fetch(`${relay1}${EndPoints[5]}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Transfer Invoice failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => d.invoices[0].invoiceId);
      }
    });
    if (notifiedInvIds !== undefined) resolve(notifiedInvIds);
  });
};

const confirmInvoice = (data) => {
  return new Promise<{
    invoiceId: string;
    actionResponse: string;
  }[]>(async (resolve, reject) => {
    const confirmInvResult = await fetch(`${relay2}${EndPoints[7]}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Confirm Invoice failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => ({ invoiceId: d.invoiceId, actionResponse: d.actionResponse }));
      }
    });
    if (confirmInvResult !== undefined) resolve(confirmInvResult);
  });
};

const updatePaymentStatus = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    const invFinInvIds = await fetch(`${relay2}${EndPoints[8]}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data), agent
    }).then(res => {
      if (res.status !== 200) {
        reject(`ERROR! Update payment status of Invoice failed (${res.status}): ${res.statusText}`);
      } else {
        return data.map(d => d.invoiceId);
      }
    });
    if (invFinInvIds !== undefined) resolve(invFinInvIds);
  });
};

// const readCommits = (accessToken: string, query: string) => {
//   return new Promise<any>(async (resolve, reject) => {
//     const result = await fetch(qryhdr, {
//       method: 'POST',
//       headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken}` },
//       body: JSON.stringify({
//         operationName: 'FullTextSearchCommit',
//         query: QUERY['FullTextSearchCommit'], variables: { query } // : `${id} @event:{PoProcessed}`
//       })
//     }).then(res => res.json())
//       .then(({ data: { fullTextSearchCommit: { items } } }) => items)
//       .catch(error => reject(error));
//     if (result !== undefined) resolve(result);
//   });
// };

const readEntities = (tag: string, accessToken: string, query: string, expected?: (results: any[]) => boolean) => {
  return new Promise<any>(async (resolve, reject) => {
    let count = READ_RETRY;
    let result: void | any[];

    const headers = { 'content-type': 'application/json' };
    if (accessToken) headers['authorization'] = `bearer ${accessToken}`;

    while ((!result || (result === undefined)) && (count > 0)) {
      result = await fetch(qryhdr, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operationName: 'FullTextSearchEntity',
          query: QUERY['FullTextSearchEntity'], variables: { query } // : `${id} @event:{PoProcessed}`
        })
      })
      .then(res => res.json())
      .then(({ data: { fullTextSearchEntity: { items }}}: { data: { fullTextSearchEntity: { items: any[] }}}) => {
        if (Array.isArray(items) && (items.length > 0) && (!expected || expected(items))) return items;
      })
      .catch(error => reject(error));
      if (result === undefined) {
        count --;
        if (count < 1) console.log(`${tag} read entities ${query} retrying in ${READ_WAIT} ms (${count})`);
        await new Promise(resolve => setTimeout(resolve, READ_WAIT));
      }
    }
    if (result === undefined)
      reject(`WARNING!!! Read entities timeout: ${query}`);
    else
      resolve(result);
  });
};

const runTest = (run: string, index: number, variant: string, accessToken?: string) => {
  const data = getTestData(variant);

  return new Promise<number>(async (resolve, reject) => {
    const runStarted = Date.now();

    // Get access token
    let token;
    if (!accessToken) {
      token = await authenticate(`u${variant}`, `${variant}@fake.it`, 'p@ssw0rd')
        .catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
      if (!token || (token === undefined)) {
        console.log(`[Test run ${run} #${variant}] ERROR! Get access token failed for user u${variant}`);
        reject(index);
        return;
      }
    } else {
      token = accessToken;
    }
    console.log(`[Test run ${run} #${variant}] Start  (ts ${runStarted}), access token: ${token.substr(0, 70)}...`);

    // PO processing
    const poIds = await createPo(data.PoCreate).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (poIds && (poIds !== undefined)) {
      const shouldContinue = await Promise.all(poIds.map(async p =>
        readEntities(`[Test run ${run} #${variant}] Create POs`, token, p)
          .then(_ => true)
          .catch(error => console.log(`[Test run ${run} #${variant}] Create POs ${error}`))
      ));
      if (!shouldContinue.reduce((a, c) => a && c, true)) {
        reject(index);
        return;
      }
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Create POs failed`);
      reject(index);
      return;
    }

    const editedPoIds = await editPo(data.PoEdit).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (editedPoIds && (editedPoIds !== undefined)) {
      const shouldContinue = await Promise.all(editedPoIds.map(async p => 
        readEntities(`[Test run ${run} #${variant}] Edit POs`, token, p, (results: any[]) =>
          results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":1`) >= 0)), true)
        ).then(_ => true).catch(error => console.log(`[Test run ${run} #${variant}] Edit POs ${error}`))
      ));
      if (!shouldContinue.reduce((a, c) => a && c, true)) {
        reject(index);
        return;
      }
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Edit POs failed`);
      reject(index);
      return;
    }

    const cancelledPoIds = await cancelPo(data.PoCancel).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (cancelledPoIds && (cancelledPoIds !== undefined)) {
      const shouldContinue = await Promise.all(cancelledPoIds.map(async p => 
        readEntities(`[Test run ${run} #${variant}] Cancel POs`, token, p, (results: any[]) =>
          results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":4`) >= 0)), true)
        ).then(_ => true).catch(error => console.log(`[Test run ${run} #${variant}] Cancel POs ${error}`))
      ));
      if (!shouldContinue.reduce((a, c) => a && c, true)) {
        reject(index);
        return;
      }
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Cancel POs failed`);
      reject(index);
      return;
    }

    const processPoResult = await processPo(data.PoProcess).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (processPoResult && (processPoResult !== undefined)) {
      const shouldContinue = await Promise.all(processPoResult.map(async p =>
        readEntities(`[Test run ${run} #${variant}] Process POs`, token, p.poId, (results: any[]) =>
          results.reduce((accu, r) => {
            return (
              accu &&
              p.actionResponse === '1' ? (r.value.indexOf(`"status":2`) >= 0) : (r.value.indexOf(`"status":3`) >= 0)
            );
          }, true)
        ).then(_ => true).catch(error => console.log(`[Test run ${run} #${variant}] Process POs ${error}`))
      ));
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Process POs failed`);
      reject(index);
      return;
    }

    // Invoice processing
    const invIds = await createInvoice(data.InvCreate).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (invIds && (invIds !== undefined)) {
      const shouldContinue = await Promise.all(invIds.map(async v => 
        readEntities(`[Test run ${run} #${variant}] Create Invoices`, token, v).then(_ => true)
          .catch(error => console.log(`[Test run ${run} #${variant}] Create Invoices ${error}`))
      ));
      if (!shouldContinue.reduce((a, c) => a && c, true)) {
        reject(index);
        return;
      }
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Create Invoices failed`);
      reject(index);
      return;
    }

    const editedInvIds = await editInvoice(data.InvEdit).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (editedInvIds && (editedInvIds !== undefined)) {
      const shouldContinue = await Promise.all(editedInvIds.map(async v => 
        readEntities(`[Test run ${run} #${variant}] Edit Invoices`, token, v, (results: any[]) =>
          results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":1`) >= 0)), true)
        ).then(_ => true).catch(error => console.log(`[Test run ${run} #${variant}] Edit Invoices ${error}`))
      ));
      if (!shouldContinue.reduce((a, c) => a && c, true)) {
        reject(index);
        return;
      }
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Edit Invoices failed`);
      reject(index);
      return;
    }

    const notifiedInvIds = await transferInvoice(data.InvNotify).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (notifiedInvIds && (notifiedInvIds !== undefined)) {
      const shouldContinue = await Promise.all(notifiedInvIds.map(async v => 
        readEntities(`[Test run ${run} #${variant}] Transfer Invoices`, token, v, (results: any[]) =>
          results.reduce((accu, r) => (accu && (r.value.indexOf(`"financeNo"`) >= 0)), true)
        ).then(_ => true).catch(error => console.log(`[Test run ${run} #${variant}] Trasnfer Invoices ${error}`))
      ));
      if (!shouldContinue.reduce((a, c) => a && c, true)) {
        reject(index);
        return;
      }
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Transfer Invoices failed`);
      reject(index);
      return;
    }

    const confirmInvResult = await confirmInvoice(data.InvResult).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (confirmInvResult && (confirmInvResult !== undefined)) {
      const shouldContinue = await Promise.all(confirmInvResult.map(async v => 
        readEntities(`[Test run ${run} #${variant}] Confirm Invoices`, token, v.invoiceId, (results: any[]) =>
          results.reduce((accu, r) => {
            return (
              accu &&
              v.actionResponse === '1' ? (r.value.indexOf(`"status":2`) >= 0) : (r.value.indexOf(`"status":3`) >= 0)
            );
          }, true)
        ).then(_ => true).catch(error => console.log(`[Test run ${run} #${variant}] Confirm Invoices ${error}`))
      ));
      if (!shouldContinue.reduce((a, c) => a && c, true)) {
        reject(index);
        return;
      }
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Confirm Invoices failed`);
      reject(index);
      return;
    }

    const invFinInvIds = await updatePaymentStatus(data.InvFin).catch(error => console.log(`[Test run ${run} #${variant}] ${error}`));
    if (invFinInvIds && (invFinInvIds !== undefined)) {
      const shouldContinue = await Promise.all(invFinInvIds.map(async v => 
        readEntities(`[Test run ${run} #${variant}] Update payment status`, token, v, (results: any[]) =>
          results.reduce((accu, r) => (accu && (r.value.indexOf(`"remittanceBank"`) >= 0)), true)
        ).then(_ => true).catch(error => console.log(`[Test run ${run} #${variant}] Update payment status ${error}`))
      ));
      if (!shouldContinue.reduce((a, c) => a && c, true)) {
        reject(index);
        return;
      }
    } else {
      console.log(`[Test run ${run} #${variant}] ERROR! Update payment status failed`);
      reject(index);
      return;
    }

    const runFinish = Date.now();
    console.log(`[Test run ${run} #${variant}] Finish (ts ${runFinish}), elapsed time ${runFinish - runStarted} ms`);
    resolve(0);
  });
};

// Start
(async () => {
  let index = 0;

  // const token = await authenticate(`u${stamp}`, `u${stamp}@fake.it`, 'p@ssw0rd')
  //   .catch(error => console.log(`Authenticate: ${error}`));
  // if (!token || (token === undefined)) {
  //   console.log(`ERROR! Get access token failed for user u${stamp}`);
  //   return;
  // }
  // console.log(`Access token: ${token.substr(0, 70)}...`);

  console.log(`Running ${RUNS}x${BATCH} relay tests (${RUNS_WAIT}ms, ${READ_WAIT}ms x ${READ_RETRY})...`);
  for (let i = 0; i < RUNS; i ++) {
    const variants = [];
    for (let j = 0; j < BATCH; j ++) {
      variants.push(`${stamp}${('' + index).padStart(range, '0')}`);
      index ++;
    }

    const run = (''+(i+1)).padStart(range, '0');
    console.log(`[Test run ${run}] Starting...`);

    Promise.all(variants.map((v, i) => runTest(run, i, v)))
      .then(values => {
        console.log(`[Test run ${run}] Completed (${values.length})`); // because Promise.all will resolve only if all promises resolved
      })
      .catch(errors => {
        console.log(`[Test run ${run}] Error ${errors}`);
      });
    await new Promise(resolve => setTimeout(resolve, RUNS_WAIT));
  }
})();
