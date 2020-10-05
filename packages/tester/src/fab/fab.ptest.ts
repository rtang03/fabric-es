require('dotenv').config({ path: './.env' });
import { Console } from 'console';
import https from 'https';
import { curry } from 'lodash';
import fetch from 'node-fetch';
import { getTestData, QUERY } from '../relay/mockUtils';
import { PerfTest } from './ptest';
// const percentile = require('percentile');

let totalElapsed = 0;
let totalAuth = 0;
let totalProc = 0;
let totalWrite = 0;
let totalRuns = 0;

enum API {
  createPo = 'createPo', 
  editPo = 'editPo', 
  cancelPo = 'cancelPo', 
  processPo = 'processPo', 
  createInvoice = 'createInvoice', 
  editInvoice = 'editInvoice', 
  transferInvoice = 'transferInvoice', 
  confirmInvoice = 'confirmInvoice', 
  updatePaymentStatus = 'updatePaymentStatus'
}
const TestRules = {
  createPo:[API.createPo], 
  editPo:[API.createPo, API.editPo], 
  cancelPo:[API.createPo, API.cancelPo],
  processPo:[API.createPo, API.processPo], 
  createInvoice:[API.createPo, API.processPo, API.createInvoice],  
  editInvoice:[API.createPo, API.processPo, API.createInvoice, API.editInvoice],
  transferInvoice:[API.createPo, API.processPo, API.createInvoice, API.transferInvoice],
  confirmInvoice:[API.createPo, API.processPo, API.createInvoice, API.confirmInvoice],
  updatePaymentStatus:[API.createPo, API.processPo, API.createInvoice, API.confirmInvoice, API.updatePaymentStatus],
  all:[API.createPo, API.editPo, API.cancelPo, API.processPo, API.createInvoice, API.editInvoice, API.transferInvoice, API.confirmInvoice, API.updatePaymentStatus],
}

interface runTestResult {
  resolveResult:number,
  batchId:string,
  urlTsRec:{[k:string]:any},
}

// TODO: Set rule to be test
const testRule:API[] = TestRules.all;

const lastElapsedTimes = [];
const runTest = (run: string, index: number, variant: string, useAuth: boolean, accessToken?: string) => {
  const data = getTestData(variant);
  let batchRes:runTestResult ={
    resolveResult:0,
    batchId:run,
    urlTsRec:{},
  };

  return new Promise<runTestResult>(async (resolve, reject) => {
    const authStarts = Date.now();

    // Get access token
    let token;
    if (!accessToken && useAuth) {
      try {
        token = await PerfTest.authenticate(`u${variant}`, `${variant}@fake.it`, 'p@ssw0rd');
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
    if (testRule.some(e => e === API.createPo)) {
      try {
        const writeStart = Date.now();
        const poIds = await PerfTest.createPo(data.PoCreate);

        if (poIds && (poIds !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(poIds.map(async p =>
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Create POs`, token, p)
              .then(_ => true)
              .catch(error => console.log(`[Test run ${run}][#${variant}] Create POs ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Create POs stopped. Reading created POs failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.createPo = Date.now()-writeStart;
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
    }

    if (testRule.some(e => e === API.editPo)) {
      try {
        const writeStart = Date.now();
        const editedPoIds = await PerfTest.editPo(data.PoEdit);
        if (editedPoIds && (editedPoIds !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(editedPoIds.map(async p => 
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Edit POs`, token, p, (results: any[]) =>
              results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":1`) >= 0)), true)
            ).then(_ => true).catch(error => console.log(`[Test run ${run}][#${variant}] Edit POs ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Edit POs stopped. Reading edited POs failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.editPo = Date.now()-writeStart;
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
    }

    if (testRule.some(e => e === API.cancelPo)) {
      try {
        const writeStart = Date.now();
        const cancelledPoIds = await PerfTest.cancelPo(data.PoCancel);
        if (cancelledPoIds && (cancelledPoIds !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(cancelledPoIds.map(async p => 
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Cancel POs`, token, p, (results: any[]) =>
              results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":4`) >= 0)), true)
            ).then(_ => true).catch(error => console.log(`[Test run ${run}][#${variant}] Cancel POs ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Cancel POs stopped. Reading cancelled POs failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.cancelPo = Date.now()-writeStart;
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
    }

    if (testRule.some(e => e === API.processPo)) {
      try {
        const writeStart = Date.now();
        const processPoResult = await PerfTest.processPo(data.PoProcess);
        if (processPoResult && (processPoResult !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(processPoResult.map(async p =>
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Process POs`, token, p.poId, (results: any[]) =>
              results.reduce((accu, r) => {
                return (
                  accu &&
                  p.actionResponse === '1' ? (r.value.indexOf(`"status":2`) >= 0) : (r.value.indexOf(`"status":3`) >= 0)
                );
              }, true)
            ).then(_ => true).catch(error => console.log(`[Test run ${run}][#${variant}] Process POs ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Process POs stopped. Reading processed POs failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.processPo = Date.now()-writeStart;
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
    }

    // Invoice processing
    if (testRule.some(e => e === API.createInvoice)) {
      try {
        const writeStart = Date.now();
        const invIds = await PerfTest.createInvoice(data.InvCreate);
        if (invIds && (invIds !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(invIds.map(async v => 
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Create Invoices`, token, v).then(_ => true)
              .catch(error => console.log(`[Test run ${run}][#${variant}] Create Invoices ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Create Invoices stopped. Reading created invoices failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.createInvoice = Date.now()-writeStart;
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
    }

    if (testRule.some(e => e === API.editInvoice)) {
      try {
        const writeStart = Date.now();
        const editedInvIds = await PerfTest.editInvoice(data.InvEdit);
        if (editedInvIds && (editedInvIds !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(editedInvIds.map(async v => 
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Edit Invoices`, token, v, (results: any[]) =>
              results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":1`) >= 0)), true)
            ).then(_ => true).catch(error => console.log(`[Test run ${run}][#${variant}] Edit Invoices ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Edit Invoices stopped. Reading edited invoices failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.editInvoice = Date.now()-writeStart;
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
    }

    if (testRule.some(e => e === API.transferInvoice)) {
      try {
        const writeStart = Date.now();
        const notifiedInvIds = await PerfTest.transferInvoice(data.InvNotify);
        if (notifiedInvIds && (notifiedInvIds !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(notifiedInvIds.map(async v => 
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Transfer Invoices`, token, v, (results: any[]) =>
              results.reduce((accu, r) => (accu && (r.value.indexOf(`,InvoiceTransferred`) >= 0)), true)
            ).then(_ => true).catch(error => console.log(`[Test run ${run}][#${variant}] Trasnfer Invoices ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Transfer Invoices stopped. Reading transferred invoices failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.transferInvoice = Date.now()-writeStart;
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
    }

    if (testRule.some(e => e === API.confirmInvoice)) {
      try {
        const writeStart = Date.now();
        const confirmInvResult = await PerfTest.confirmInvoice(data.InvResult);
        if (confirmInvResult && (confirmInvResult !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(confirmInvResult.map(async v => 
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Confirm Invoices`, token, v.invoiceId, (results: any[]) =>
              results.reduce((accu, r) => {
                return (
                  accu &&
                  v.actionResponse === '1' ? (r.value.indexOf(`"status":2`) >= 0) : (r.value.indexOf(`"status":3`) >= 0)
                );
              }, true)
            ).then(_ => true).catch(error => console.log(`[Test run ${run}][#${variant}] Confirm Invoices ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Confirm Invoices stopped. Reading confirmed invoices failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.confirmInvoice = Date.now()-writeStart;
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
    }

    if (testRule.some(e => e === API.editPo)) {
      try {
        const writeStart = Date.now();
        const invFinInvIds = await PerfTest.updatePaymentStatus(data.InvFin);
        if (invFinInvIds && (invFinInvIds !== undefined)) {
          write += (Date.now() - writeStart);
          const shouldContinue = await Promise.all(invFinInvIds.map(async v => 
            PerfTest.readEntities(`[Test run ${run}][#${variant}] Update payment status`, token, v, (results: any[]) =>
              results.reduce((accu, r) => (accu && (r.value.indexOf(`,PaymentStatusUpdated`) >= 0)), true)
            ).then(_ => true).catch(error => console.log(`[Test run ${run}][#${variant}] Update payment status ${error}`))
          ));
          if (!shouldContinue.reduce((a, c) => a && c, true)) {
            console.log(`[Test run ${run}][#${variant}] Update payment status stopped. Reading updated invoices failed`);
            reject(index);
            return;
          }
          batchRes.urlTsRec.updatePaymentStatus = Date.now()-writeStart;
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
    
    resolve(batchRes);
  });
};

// Start
(async () => {
  let index = 0;
  const cfg = PerfTest.defaultCfg;
  const RUNS = cfg.RUNS;
  const BATCH = cfg.BATCH;
  const RUNS_WAIT = cfg.RUNS_WAIT;
  const READ_WAIT = cfg.RUNS_WAIT;
  const stamp = cfg.stamp;
  const range = cfg.range;
  const lessAuth = cfg.lessAuth;
  const READ_RETRY = cfg.READ_RETRY;

  console.log(`Running ${RUNS} x ${BATCH} relay tests (${RUNS_WAIT}ms, ${READ_WAIT}ms x ${READ_RETRY})...`);
  totalElapsed = 0;
  totalAuth = 0;
  totalProc = 0;
  totalWrite = 0;
  totalRuns = 0;
  lastElapsedTimes.splice(0, lastElapsedTimes.length);
  
  for (let i = 0; i < RUNS; i ++) {
    const variants = [];
    for (let j = 0; j < BATCH; j ++) {
      variants.push(`${stamp}${('' + index).padStart(range, '0')}`);
      index ++;
    }

    const run = (''+(i+1)).padStart(range, '0');
    const runsWait = lastElapsedTimes.length <= 0 ?
      RUNS_WAIT :
      (Math.ceil(lastElapsedTimes.reduce((a, c) => a + c, 0) / lastElapsedTimes.length) * 1000);
    const authStarts = Date.now();

    let token;
    if (lessAuth === 'yes') {
      try {
        token = await PerfTest.authenticate(`u${stamp}${run}`, `${stamp}${run}@fake.it`, 'p@ssw0rd');
      } catch (error) {
        console.log(`ERROR! ${error}`);
        continue;
      }
      if (!token || (token === undefined)) {
        console.log(`ERROR! Get access token failed for user u${stamp}${run}`);
        continue;
      }
      console.log(`[Test run ${run}][Ran for ${((Date.now() - stamp)/1000).toFixed(3)}s] Starting, next batch in ${runsWait}ms, access token: ${token.substr(0, 70)}...`);
      totalAuth += ((Date.now() - authStarts) / 1000);
    } else {
      console.log(`[Test run ${run}][Ran for ${((Date.now() - stamp)/1000).toFixed(3)}s] Starting, next batch in ${runsWait}ms...`);
    }

    Promise.all(variants.map(async (v, i) => {
      if (lessAuth === 'yes') {
        return runTest(run, i, v, true, token);
      } else if (lessAuth === 'off') {
        return runTest(run, i, v, false);
      } else {
        return runTest(run, i, v, true);
      }
    }))
      .then(values => {

        values.forEach( batchRes => {
          console.log("Details of Each PO(s) " + JSON.stringify(batchRes));
        });

        testRule.forEach(e => {
          console.log(`[Test run ${run}][Stat. of ${e}] `
          + `Min: ${Math.min.apply(Math, values.map(function(o) { return o.urlTsRec[e]; }))}ms, `
          + `Max: ${Math.max.apply(Math, values.map(function(o) { return o.urlTsRec[e]; }))}ms, `
          + `Avg: ${values.reduce((sum, cur) => sum+cur.urlTsRec[e], 0) / values.length}ms, `  
          // + `P95: ${percentile(95, values.map(o => o.urlTsRec[e]))}`
          );
        });
      
        // Promise.all will resolve only if all promises resolved
        if (lessAuth === 'yes') {
          console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Completed: ${values.length} (A: ${Math.round(totalAuth/(i+1))}s)`);
        } else {
          console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Completed: ${values.length}`);
        }
      })
      .catch(errors => {
        console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Error: ${errors}`);
      });
    await new Promise(resolve => setTimeout(resolve, runsWait));
  }
})();