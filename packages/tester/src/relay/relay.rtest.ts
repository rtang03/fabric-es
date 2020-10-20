require('dotenv').config({ path: './.env' });
import fs from 'fs';
import https from 'https';
import axios from 'axios';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { getLogger } from './getLogger';
import { getTestData, QUERY } from './mockUtils';
import { getAnalyzer } from './relay.analyzer';

const logger = getLogger('[tester] relay.rtest.js');

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

const poto = (!process.env.SERVER_KEY || !process.env.SERVER_CERT) ? 'http://' : 'https://';
const BATCH = parseInt(process.env.BATCH_NUM, 10) || 5; // Number of tests per run
const RUNS = parseInt(process.env.RUNS_NUM, 10) || 3; // Total number of runs
const RUNS_WAIT = parseInt(process.env.RUNS_WAIT, 10) || 30000; // Time to wait before sending the next batch of test (ms)
const READ_RETRY = parseInt(process.env.READ_RETRY, 10) || 20; // Number of retries to read expected results from Fabric
const READ_WAIT = parseInt(process.env.READ_WAIT, 10) || 3000; // Time to wait between each read retry
const athreg = `http://${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}/account`;
const athlog = `http://${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}/account/login`;
const relay1 = `${poto}${process.env.RELAY_HOST1}:${process.env.RELAY_PORT1}`; // ETC side
const relay2 = `${poto}${process.env.RELAY_HOST2}:${process.env.RELAY_PORT2}`; // PBOC side
const qryhdr = `http://${process.env.QUERY_HOST}:${process.env.QUERY_PORT}/graphql`; // FDI node

const ATTACHMENT_PATH = process.env.ATTACHMENT_PATH;
const STATS_DATA = process.env.STATS_DATA;
const LOG_TARGET = process.env.LOG_TARGET;
const STATS_LOGS = process.env.STATS_LOGS;
let analyzer;
if (LOG_TARGET.includes('file')) {
  if (STATS_DATA)
    analyzer = getAnalyzer(STATS_LOGS, STATS_DATA);
  else
    analyzer = getAnalyzer(STATS_LOGS);
}

// 'yes'  - authenticate for every test
// 'no'   - do not authenticate at all
// 'less' - authenticate once per batch
const authOn = process.env.AUTH_ON || 'yes';

const range = Math.round(Math.log10(RUNS * BATCH)) + 1;
const stamp = Date.now();
const agent = (poto === 'https://') ? new https.Agent({ rejectUnauthorized: false }) : undefined;

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
      if (ATTACHMENT_PATH && (data.filter(d => d.attachment).length > 0)) {
        // Since the API only allows either no file at all, or each PO with 1 file, the API is called separately here
        // for POs without attachments
        const json = data.filter(d => !d.attachment);

        const atths = data.filter(d => d.attachment);
        const form = new FormData();
        const jsonObj = [];
        for (const atth of atths) {
          const { attachment, ...rest } = atth;
          form.append('files', fs.createReadStream(`${ATTACHMENT_PATH}${attachment}`));
          jsonObj.push(rest);
        }
        form.append('jsonObj', JSON.stringify(jsonObj));

        Promise.all([
          axios({
            method: 'POST',
            url: `${relay2}${EndPoints[1]}`,
            data: form,
            headers: form.getHeaders(),
            httpsAgent: agent
          }),
          fetch(`${relay2}${EndPoints[1]}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(json), agent
          }),
        ]).then(res => {
          if (res.filter(r => r.status !== 200).length > 0) {
            reject(`ERROR! Create PO failed (${res}`);
          } else {
            resolve(data.map(d => d.poBaseInfo.poId));
          }
        });
      } else {
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
      }
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
        if (count < 0) console.log(`${tag} read entities ${query} retrying in ${READ_WAIT} ms (${count})`);
        await new Promise(resolve => setTimeout(resolve, READ_WAIT));
      } catch(error) {
        reject(error);
        return;
      }
    }
    reject(`WARNING!!! Read entities timeout: ${query}`);
  });
};

let totalElapsed;
let totalAuth;
let totalProc;
let totalWrite;
let totalRuns;
const lastElapsedTimes = [];

const runTest = (run: string, index: number, variant: string, useAuth: boolean, accessToken?: string) => {
  const data = getTestData(variant);

  return new Promise<number>(async (resolve, reject) => {
    const authStarts = Date.now();

    // Get access token
    let token;
    if (!accessToken && useAuth) {
      try {
        token = await authenticate(`u${variant}`, `${variant}@fake.it`, 'p@ssw0rd');
      } catch (error) {
        console.log(`[Test run ${run}][#${variant}] ${error}`);
        reject(index);
        return;
      }
      if (!token || (token === undefined)) {
        console.log(`[Test run ${run}][#${variant}] ERROR! Get access token failed for user u${variant}`);
        reject(index);
        return;
      }
    } else {
      token = accessToken;
    }

    const procStarts = Date.now();
    let write = 0;
    console.log(`[Test run ${run}][#${variant}] Starting (ts ${procStarts})${(!accessToken && useAuth) ? `, access token: ${token.substr(0, 70)}...` : '...'}`);

    // PO processing
    try {
      const writeStart = Date.now();
      const poIds = await createPo(data.PoCreate);
      if (poIds && (poIds !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/order/po","method":"POST","entities":${JSON.stringify(poIds)},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(poIds.map(async p =>
          readEntities(`[Test run ${run}][#${variant}] Create POs`, token, p)
            .then(_ => {
              logger.debug(`[ROBUSTNESS]{"url":"/order/po","method":"POST","entities":"${p}","readNttyFinish":${Date.now()}}`);
              if (analyzer) analyzer('createPo', p);
              return true;
            })
            .catch(error => console.log(`[Test run ${run}][#${variant}] Create POs ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Create POs stopped. Reading created POs failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Create POs failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Create POs throws ${error}`);
      reject(index);
      return;
    }

    try {
      const writeStart = Date.now();
      const editedPoIds = await editPo(data.PoEdit);
      if (editedPoIds && (editedPoIds !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/order/po","method":"PUT","entities":${JSON.stringify(editedPoIds)},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(editedPoIds.map(async p => 
          readEntities(`[Test run ${run}][#${variant}] Edit POs`, token, p, (results: any[]) =>
            results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":1`) >= 0)), true)
          ).then(_ => {
            logger.debug(`[ROBUSTNESS]{"url":"/order/po","method":"PUT","entities":"${p}","readNttyFinish":${Date.now()}}`);
            if (analyzer) analyzer('editPo', p);
            return true;
          })
          .catch(error => console.log(`[Test run ${run}][#${variant}] Edit POs ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Edit POs stopped. Reading edited POs failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Edit POs failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Edit POs throws ${error}`);
      reject(index);
      return;
    }

    try {
      const writeStart = Date.now();
      const cancelledPoIds = await cancelPo(data.PoCancel);
      if (cancelledPoIds && (cancelledPoIds !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/order/cancelPO","method":"POST","entities":${JSON.stringify(cancelledPoIds)},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(cancelledPoIds.map(async p => 
          readEntities(`[Test run ${run}][#${variant}] Cancel POs`, token, p, (results: any[]) =>
            results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":4`) >= 0)), true)
          ).then(_ => {
            logger.debug(`[ROBUSTNESS]{"url":"/order/cancelPO","method":"POST","entities":"${p}","readNttyFinish":${Date.now()}}`);
            if (analyzer) analyzer('cancelPo', p);
            return true;
          })
          .catch(error => console.log(`[Test run ${run}][#${variant}] Cancel POs ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Cancel POs stopped. Reading cancelled POs failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Cancel POs failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Cancel POs throws ${error}`);
      reject(index);
      return;
    }

    try {
      const writeStart = Date.now();
      const processPoResult = await processPo(data.PoProcess);
      if (processPoResult && (processPoResult !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/etccorp/pboc/api/v1/po/process","method":"POST","entities":${JSON.stringify(processPoResult.map(p => p.poId))},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(processPoResult.map(async p =>
          readEntities(`[Test run ${run}][#${variant}] Process POs`, token, p.poId, (results: any[]) =>
            results.reduce((accu, r) => {
              return (
                accu &&
                p.actionResponse === '1' ? (r.value.indexOf(`"status":2`) >= 0) : (r.value.indexOf(`"status":3`) >= 0)
              );
            }, true)
          ).then(_ => {
            logger.debug(`[ROBUSTNESS]{"url":"/etccorp/pboc/api/v1/po/process","method":"POST","entities":"${p.poId}","readNttyFinish":${Date.now()}}`);
            if (analyzer) analyzer('processPo', p.poId);
            return true;
          })
          .catch(error => console.log(`[Test run ${run}][#${variant}] Process POs ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Process POs stopped. Reading processed POs failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Process POs failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Process POs throws ${error}`);
      reject(index);
      return;
    }

    // Invoice processing
    try {
      const writeStart = Date.now();
      const invIds = await createInvoice(data.InvCreate);
      if (invIds && (invIds !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/etccorp/pboc/api/v1/invoices","method":"POST","entities":${JSON.stringify(invIds)},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(invIds.map(async v => 
          readEntities(`[Test run ${run}][#${variant}] Create Invoices`, token, v)
            .then(_ => {
              logger.debug(`[ROBUSTNESS]{"url":"/etccorp/pboc/api/v1/invoices","method":"POST","entities":"${v}","readNttyFinish":${Date.now()}}`);
              if (analyzer) analyzer('createInvoice', v);
              return true;
            })
            .catch(error => console.log(`[Test run ${run}][#${variant}] Create Invoices ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Create Invoices stopped. Reading created invoices failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Create Invoices failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Create Invoices throws ${error}`);
      reject(index);
      return;
    }

    try {
      const writeStart = Date.now();
      const editedInvIds = await editInvoice(data.InvEdit);
      if (editedInvIds && (editedInvIds !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/etccorp/pboc/api/v1/invoices","method":"PUT","entities":${JSON.stringify(editedInvIds)},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(editedInvIds.map(async v => 
          readEntities(`[Test run ${run}][#${variant}] Edit Invoices`, token, v, (results: any[]) =>
            results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":1`) >= 0)), true)
          ).then(_ => {
            logger.debug(`[ROBUSTNESS]{"url":"/etccorp/pboc/api/v1/invoices","method":"PUT","entities":"${v}","readNttyFinish":${Date.now()}}`);
            if (analyzer) analyzer('editInvoice', v);
            return true;
          })
          .catch(error => console.log(`[Test run ${run}][#${variant}] Edit Invoices ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Edit Invoices stopped. Reading edited invoices failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Edit Invoices failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Edit Invoices throws ${error}`);
      reject(index);
      return;
    }

    try {
      const writeStart = Date.now();
      const notifiedInvIds = await transferInvoice(data.InvNotify);
      if (notifiedInvIds && (notifiedInvIds !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/etccorp/pboc/api/v1/invoices/notify","method":"POST","entities":${JSON.stringify(notifiedInvIds)},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(notifiedInvIds.map(async v => 
          readEntities(`[Test run ${run}][#${variant}] Transfer Invoices`, token, v, (results: any[]) =>
            results.reduce((accu, r) => (accu && (r.value.indexOf(`,InvoiceTransferred`) >= 0)), true)
          ).then(_ => {
            logger.debug(`[ROBUSTNESS]{"url":"/etccorp/pboc/api/v1/invoices/notify","method":"POST","entities":"${v}","readNttyFinish":${Date.now()}}`);
            if (analyzer) analyzer('transferInvoice', v);
            return true;
          })
          .catch(error => console.log(`[Test run ${run}][#${variant}] Trasnfer Invoices ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Transfer Invoices stopped. Reading transferred invoices failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Transfer Invoices failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Transfer Invoices throws ${error}`);
      reject(index);
      return;
    }

    try {
      const writeStart = Date.now();
      const confirmInvResult = await confirmInvoice(data.InvResult);
      if (confirmInvResult && (confirmInvResult !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/invoice/result","method":"POST","entities":${JSON.stringify(confirmInvResult.map(v => v.invoiceId))},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(confirmInvResult.map(async v => 
          readEntities(`[Test run ${run}][#${variant}] Confirm Invoices`, token, v.invoiceId, (results: any[]) =>
            results.reduce((accu, r) => {
              return (
                accu &&
                v.actionResponse === '1' ? (r.value.indexOf(`"status":2`) >= 0) : (r.value.indexOf(`"status":3`) >= 0)
              );
            }, true)
          ).then(_ => {
            logger.debug(`[ROBUSTNESS]{"url":"/invoice/result","method":"POST","entities":"${v.invoiceId}","readNttyFinish":${Date.now()}}`);
            if (analyzer) analyzer('confirmInvoice', v.invoiceId);
            return true;
          })
          .catch(error => console.log(`[Test run ${run}][#${variant}] Confirm Invoices ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Confirm Invoices stopped. Reading confirmed invoices failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Confirm Invoices failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Confirm Invoices throws ${error}`);
      reject(index);
      return;
    }

    try {
      const writeStart = Date.now();
      const invFinInvIds = await updatePaymentStatus(data.InvFin);
      if (invFinInvIds && (invFinInvIds !== undefined)) {
        const writeFinish = Date.now();
        write += (writeFinish - writeStart);
        logger.debug(`[ROBUSTNESS]{"url":"/trade-financing/invresult","method":"POST","entities":${JSON.stringify(invFinInvIds)},"writeNttStarts":${writeStart},"writeNttFinish":${writeFinish}}`);
        const shouldContinue = await Promise.all(invFinInvIds.map(async v => 
          readEntities(`[Test run ${run}][#${variant}] Update payment status`, token, v, (results: any[]) =>
            results.reduce((accu, r) => (accu && (r.value.indexOf(`,PaymentStatusUpdated`) >= 0)), true)
          ).then(_ => {
            logger.debug(`[ROBUSTNESS]{"url":"/trade-financing/invresult","method":"POST","entities":"${v}","readNttyFinish":${Date.now()}}`);
            if (analyzer) analyzer('updatePaymentStatus', v);
            return true;
          })
          .catch(error => console.log(`[Test run ${run}][#${variant}] Update payment status ${error}`))
        ));
        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] Update payment status stopped. Reading updated invoices failed`);
          reject(index);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! Update payment status failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] Update payment status throws ${error}`);
      reject(index);
      return;
    }

    const runFinish = Date.now();
    const auth = procStarts - authStarts;
    const proc = runFinish - procStarts;
    const elapsed = runFinish - authStarts;
    totalElapsed += elapsed / 1000;
    if (!accessToken) totalAuth += (auth) / 1000;
    totalProc += (proc) / 1000;
    totalWrite += write;
    totalRuns ++;
    lastElapsedTimes.push(elapsed / 1000);
    if (lastElapsedTimes.length > 100) lastElapsedTimes.shift(); // Elapsed times of the last 10 runs

    if (useAuth) {
      console.log(
`[Test run ${run}][#${variant}] Finished (ts ${runFinish}). E: ${elapsed}ms/${Math.round(totalElapsed/totalRuns)}s; A: ${auth}ms/${Math.round(totalAuth/totalRuns)}s; P: ${proc}ms/${Math.round(totalProc/totalRuns)}s; W: ${write}ms/${Math.round(totalWrite/totalRuns)}ms`
      );
    } else {
      console.log(
`[Test run ${run}][#${variant}] Finished (ts ${runFinish}). Elapsed time: ${proc}ms/${Math.round(totalProc/totalRuns)}s; W: ${write}ms/${Math.round(totalWrite/totalRuns)}ms`
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
  totalWrite = 0;
  totalRuns = 0;
  lastElapsedTimes.splice(0, lastElapsedTimes.length);
  
  // if (STATS_DATA) {
  //   try {
  //     fs.accessSync(STATS_DATA, fs.constants.F_OK);
  //     fs.unlinkSync(STATS_DATA);
  //   } catch (err) {
  //     if (!err.message.includes('no such file')) console.log(err);
  //   }
  // }

  for (let i = 0; i < RUNS; i ++) {
    const variants = [];
    for (let j = 0; j < BATCH; j ++) {
      variants.push(`${stamp}${('' + index).padStart(range, '0')}`);
      index ++;
    }

    const run = (''+(i+1)).padStart(range, '0');
    const runsWait = lastElapsedTimes.length <= 0 ?
      RUNS_WAIT :
      Math.ceil(lastElapsedTimes.reduce((a, c) => a + c, 0) / lastElapsedTimes.length);
    const authStarts = Date.now();

    // if (STATS_DATA) {
    //   const d = new Date();
    //   const dttm = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
    //   fs.writeFile(STATS_DATA, `${dttm.substring(0, 10)} ${dttm.substring(11, 19)}|${runsWait}\n`, { flag: 'a' }, err => {
    //     if (err) console.log('Error writing statistic data file', err);
    //   });
    // }

    let token;
    if (authOn === 'less') {
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
      console.log(`[Test run ${run}][Ran for ${((Date.now() - stamp)/1000).toFixed(3)}s] Starting, next batch in ${runsWait}s, access token: ${token.substr(0, 70)}...`);
      totalAuth += ((Date.now() - authStarts) / 1000);
    } else {
      console.log(`[Test run ${run}][Ran for ${((Date.now() - stamp)/1000).toFixed(3)}s] Starting, next batch in ${runsWait}s...`);
    }

    Promise.all(variants.map(async (v, i) => {
      if (authOn === 'less') {
        return runTest(run, i, v, true, token);
      } else if (authOn === 'no') {
        return runTest(run, i, v, false);
      } else {
        return runTest(run, i, v, true);
      }
    }))
      .then(values => {
        // Promise.all will resolve only if all promises resolved
        if (authOn === 'less') {
          console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Completed: ${values.length} (A: ${Math.round(totalAuth/(i+1))}s)`);
        } else {
          console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Completed: ${values.length}`);
        }
      })
      .catch(errors => {
        console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Error: ${errors}`);
      });

    await new Promise(resolve => setTimeout(resolve, runsWait * 1000));
  }
})();
