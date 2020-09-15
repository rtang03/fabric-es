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

const lessAuth = process.env.LESS_AUTH || 'no';

const range = Math.round(Math.log10(RUNS * BATCH)) + 1;
const stamp = Date.now();
const agent = new https.Agent({ rejectUnauthorized: false });

const authenticate = (username, email, password) => {
  return new Promise<string>(async (resolve, reject) => {
    try {
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
            reject(`Logging in ${username}: ${JSON.stringify(data)}`);
          }
        });

        if (token !== undefined) resolve(token);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const createPo = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay2}${EndPoints[1]}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Create PO failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => d.poBaseInfo.poId));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const editPo = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay2}${EndPoints[1]}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Edit PO failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => d.poBaseInfo.poId));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const cancelPo = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay2}${EndPoints[2]}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Cancel PO failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => d.poId));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const processPo = (data) => {
  return new Promise<{
    poId: string;
    actionResponse: string;
  }[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay1}${EndPoints[3]}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Process PO failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => ({ poId: d.poId, actionResponse: d.actionResponse })));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const createInvoice = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay1}${EndPoints[4]}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Create Invoice failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => d.invBaseInfo.invoiceId));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const editInvoice = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay1}${EndPoints[4]}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Edit Invoice failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => d.invBaseInfo.invoiceId));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const transferInvoice = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay1}${EndPoints[5]}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Transfer Invoice failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => d.invoices[0].invoiceId));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const confirmInvoice = (data) => {
  return new Promise<{
    invoiceId: string;
    actionResponse: string;
  }[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay2}${EndPoints[7]}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Confirm Invoice failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => ({ invoiceId: d.invoiceId, actionResponse: d.actionResponse })));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const updatePaymentStatus = (data) => {
  return new Promise<string[]>(async (resolve, reject) => {
    try {
      await fetch(`${relay2}${EndPoints[8]}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data), agent
      }).then(res => {
        if (res.status !== 200) {
          reject(`ERROR! Update payment status of Invoice failed (${res.status}): ${res.statusText}`);
        } else {
          resolve(data.map(d => d.invoiceId));
        }
      });
    } catch (error) {
      reject(error);
    }
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

    const headers = { 'content-type': 'application/json' };
    if (accessToken) headers['authorization'] = `bearer ${accessToken}`;

    while (count > 0) {
      try {
        const result = await fetch(qryhdr, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            operationName: 'FullTextSearchEntity',
            query: QUERY['FullTextSearchEntity'], variables: { query } // : `${id} @event:{PoProcessed}`
          })
        })
        .then(res => res.json());

        if (result !== undefined) {
          if (result.errors) {
            reject(JSON.stringify(result.errors));
            return;
          } else if (result.data && result.data.fullTextSearchEntity && result.data.fullTextSearchEntity.items) {
            const items: any[] = result.data.fullTextSearchEntity.items;
            if (Array.isArray(items) && (items.length > 0) && (!expected || expected(items))) {
              resolve(items);
              return;
            }
          }
        }

        count --;
        // if (count < 1) console.log(`${tag} read entities ${query} retrying in ${READ_WAIT} ms (${count})`);
        await new Promise(resolve => setTimeout(resolve, READ_WAIT));
      } catch(error) {
        reject(error);
        return;
      }
    }
    reject(`WARNING!!! Read entities timeout: ${query}`);
  });
};

let totalElapsed = 0;
let totalAuth = 0;
let totalProc = 0;
let totalRuns = 0;

const runTest = (run: string, index: number, variant: string, accessToken?: string) => {
  const data = getTestData(variant);

  return new Promise<number>(async (resolve, reject) => {
    const authStarts = Date.now();

    // Get access token
    let token;
    if (!accessToken) {
      try {
        token = await authenticate(`u${variant}`, `${variant}@fake.it`, 'p@ssw0rd');
      } catch (error) {
        console.log(`[Test run ${run} #${variant}] ${error}`);
        reject(index);
        return;
      }
      if (!token || (token === undefined)) {
        console.log(`[Test run ${run} #${variant}] ERROR! Get access token failed for user u${variant}`);
        reject(index);
        return;
      }
    } else {
      token = accessToken;
    }

    const procStarts = Date.now();
    console.log(`[Test run ${run} #${variant}] Starting (ts ${procStarts})${(!accessToken) ? `, access token: ${token.substr(0, 70)}...` : '...'}`);

    // PO processing
    try {
      const poIds = await createPo(data.PoCreate);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    try {
      const editedPoIds = await editPo(data.PoEdit);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    try {
      const cancelledPoIds = await cancelPo(data.PoCancel);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    try {
      const processPoResult = await processPo(data.PoProcess);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    // Invoice processing
    try {
      const invIds = await createInvoice(data.InvCreate);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    try {
      const editedInvIds = await editInvoice(data.InvEdit);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    try {
      const notifiedInvIds = await transferInvoice(data.InvNotify);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    try {
      const confirmInvResult = await confirmInvoice(data.InvResult);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    try {
      const invFinInvIds = await updatePaymentStatus(data.InvFin);
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
    } catch (error) {
      console.log(`[Test run ${run} #${variant}] ${error}`);
      reject(index);
      return;
    }

    const runFinish = Date.now();
    const auth = procStarts - authStarts;
    const proc = runFinish - procStarts;
    const elapsed = runFinish - authStarts;
    totalElapsed += (elapsed) / 1000;
    if (!accessToken) totalAuth += (auth) / 1000;
    totalProc += (proc) / 1000;
    totalRuns ++;
    if (!accessToken) {
      console.log(
`[Test run ${run} #${variant}] Finished (ts ${runFinish}). E: ${elapsed}ms/${Math.round(totalElapsed/totalRuns)}s; A: ${auth}ms/${Math.round(totalAuth/totalRuns)}s; P: ${proc}ms/${Math.round(totalProc/totalRuns)}s`
      );
    } else {
      console.log(
`[Test run ${run} #${variant}] Finished (ts ${runFinish}). Elapsed time: ${proc}ms/${Math.round(totalProc/totalRuns)}s`
      );
    }
    resolve(0);
  });
};

// Start
(async () => {
  let index = 0;

  console.log(`Running ${RUNS} x ${BATCH} relay tests (${RUNS_WAIT}ms, ${READ_WAIT}ms x ${READ_RETRY})...`);
  totalElapsed = 0;
  totalAuth = 0;
  totalProc = 0;
  totalRuns = 0;
  for (let i = 0; i < RUNS; i ++) {
    const variants = [];
    for (let j = 0; j < BATCH; j ++) {
      variants.push(`${stamp}${('' + index).padStart(range, '0')}`);
      index ++;
    }

    const run = (''+(i+1)).padStart(range, '0');
    const authStarts = Date.now();

    let token;
    if (lessAuth === 'yes') {
      try {
        token = await authenticate(`u${stamp}${run}`, `${stamp}${run}@fake.it`, 'p@ssw0rd');
      } catch (error) {
        console.log(`ERROR! ${error}`);
        continue;
      }
      if (!token || (token === undefined)) {
        console.log(`ERROR! Get access token failed for user u${stamp}${run}`);
        continue;
      }
      console.log(`[Test run ${run}] Starting, access token: ${token.substr(0, 70)}...`);
      totalAuth += ((Date.now() - authStarts) / 1000);
    } else {
      console.log(`[Test run ${run}] Starting ...`);
    }

    Promise.all(variants.map(async (v, i) => {
      if (lessAuth === 'yes') {
        return runTest(run, i, v, token);
      } else {
        return runTest(run, i, v);
      }
    }))
      .then(values => {
        // Promise.all will resolve only if all promises resolved
        if (lessAuth === 'yes') {
          console.log(`[Test run ${run}] Completed ${values.length} tests successfully. Total elapsed time: ${((Date.now() - stamp)/1000/60).toFixed(6)} min (A: ${Math.round(totalAuth/(i+1))}s)`);
        } else {
          console.log(`[Test run ${run}] Completed ${values.length} tests successfully. Total elapsed time: ${((Date.now() - stamp)/1000/60).toFixed(6)} min`);
        }
      })
      .catch(errors => {
        console.log(`[Test run ${run}] Error ${errors}`);
      });
    await new Promise(resolve => setTimeout(resolve, RUNS_WAIT));
  }
})();
