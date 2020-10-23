require('dotenv').config({ path: './.env' });
import fs from 'fs';
import { getTestData, genTestData } from '../relay/mockUtils';
import { PerfTest, API, PerfTestConfig } from './ptest';
import percentile from 'stats-percentile';
import { rawListeners } from 'process';
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let totalElapsed = 0;
let totalAuth = 0;
let totalProc = 0;
let totalWrite = 0;
let totalRuns = 0;
let rawData:{[k:string]:{rl:number[], rd:number[], o1:number[], o3:number[]}} = {};

enum DocId {
  po = "poId",
  inv = "invoiceId",
}

interface runTestResult {
  res:string,
  uid:string,
  tsRec:{[k:string]:any},
}

const GrepLogCfg:{[key in keyof typeof API]: {addSrhStrRegExp:string, logPath:string, dataType:string}} = {
  [API.createInvoice]:        { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[4]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG1_LOG_PATH || './log/all.log'),
                                dataType: 'InvCreate',
                              },
  [API.editInvoice]:          { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[4]}\\",\\"method\\":\\"PUT\\"`,
                                logPath:(process.env.RL_ORG1_LOG_PATH || './log/all.log'),
                                dataType: 'InvEdit',
                              },
  [API.transferInvoice]:      { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[5]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG1_LOG_PATH || './log/all.log'),
                                dataType: 'InvNotify',
                              },
  [API.confirmInvoice]:       { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[7]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                                dataType: 'InvResult',
                              },
  [API.updatePaymentStatus]:  { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[8]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                                dataType: 'InvFin',
                              },
  [API.createPo]:             { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[1]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                                dataType: 'PoCreate',
                              },
  [API.editPo]:               { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[1]}\\",\\"method\\":\\"PUT\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                                dataType: 'PoEdit',
                              },
  [API.cancelPo]:             { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[2]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                                dataType: 'PoCancel',
                              },
  [API.processPo]:            { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[3]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG1_LOG_PATH || './log/all.log'),
                                dataType: 'PoProcess',
                              },
}

const TestRules = {
  createPo:           { preGenId:[]
                      , rules:[API.createPo]}, 
  // editPo:             { preGenId:['po']
  //                     , rules:[API.editPo]}, 
  // cancelPo:           { preGenId:['po']
  //                     , rules:[API.cancelPo]},
  // processPo:          { preGenId:['po']
  //                     , rules:[API.processPo]}, 
  createInvoice:      { preGenId:[DocId.po]
                      , rules:[API.createInvoice]},  
  // editInvoice:        { preGenId:['po','inv']
  //                     , rules:[API.editInvoice]},
  transferInvoice:    { preGenId:[DocId.po]
                      , rules:[API.createInvoice, API.transferInvoice]},
  confirmInvoice:     { preGenId:[DocId.po]
                      , rules:[API.createInvoice, API.confirmInvoice]},
  updatePaymentStatus:{ preGenId:[DocId.po]
                      , rules:[API.createInvoice, API.updatePaymentStatus]},
  enqPo:              { preGenId:[DocId.po]
                      , isEnqOnly:true
                      , rules:[API.createPo]},
  enqInv:             { preGenId:[DocId.po, DocId.inv]
                      , isEnqOnly:true
                      , rules:[API.createInvoice]},
  all:                { preGenId:[]
                      , usePerfTestData:false
                      , rules:[API.createPo, API.editPo, API.cancelPo, API.processPo, API.createInvoice, API.editInvoice, API.transferInvoice, API.confirmInvoice, API.updatePaymentStatus]},
}

const cfgTestRun = TestRules[process.env.FAB_TEST_RULE || 'all'];
const isPreGenId = cfgTestRun? (cfgTestRun.preGenId.length > 0) : false;
const testRule = cfgTestRun?cfgTestRun.rules : [];
const isEnqOnly = cfgTestRun? (cfgTestRun.isEnqOnly || false):false;
const lastElapsedTimes = [];
const isShowBkdn:boolean = (process.env.FAB_SHOW_BKDN || 'true') === "true";
const dataType = cfgTestRun.rules.map(e => GrepLogCfg[e].dataType);
const PT_HI:number = parseInt(process.env.FAB_PERCENTILE_HI_VAL || '100');
const PT_LO:number = parseInt(process.env.FAB_PERCENTILE_LO_VAL || '0');
const numSortfunc = function (a,b) {return a-b};

let preGenIds = {};

const preRunTest = (run: string, index: number, variant: string, useAuth: boolean, accessToken?: string) => {

  const data = genTestData(variant, ['PoCreate','InvCreate']);
  const genIds = TestRules[process.env.FAB_TEST_RULE || 'all'].preGenId;
  genIds.forEach( (e: DocId) => {
    if (e === DocId.po) {
      preGenIds['preGenPo'] = data.PoCreate[0].poBaseInfo.poId;
    } else if (e === DocId.inv) {
      preGenIds['preGenInv'] = data.InvCreate[0].invBaseInfo.invoiceId;
    }
  });

  return new Promise<void> (async (resolve, reject) => {
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

    // PO processing
    if (genIds.some(e => e === DocId.po)) {
      try {
        const writeStart = Date.now();
        const poIds = await PerfTest.createPo(data.PoCreate);

        if (poIds && (poIds !== undefined)) {
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

    // Invoice processing
    if (genIds.some(e => e === DocId.po)) {
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

    resolve();
  });
};

const runTest = (run: string, index: number, variant: string, useAuth: boolean, accessToken?: string) => {

  const data = (typeof cfgTestRun.usePerfTestData === 'undefined' || cfgTestRun.usePerfTestData) ? genTestData(variant, dataType, parseInt(process.env.FAB_REQ_DATA_SIZE || '2')) : getTestData(variant);
  let batchRes:runTestResult ={
    res:'reject',
    uid:variant,
    tsRec:{},
  };
  
  if (isPreGenId) {
    testRule.forEach (e => {
      if (e === API.createPo) {
        data.PoCreate.forEach(e => e.poBaseInfo.poId = preGenIds['preGenPo']);  
      } else if (e === API.createInvoice) {
        data.InvCreate.forEach(e => {
          if (preGenIds['preGenPo'])
            e.invBaseInfo.poId = preGenIds['preGenPo'];
          if (preGenIds['preGenInv'])
           e.invBaseInfo.invoiceId = preGenIds['preGenInv'];
        });
      } else if (e === API.transferInvoice) {
        data.InvNotify.forEach(e => {
          if (preGenIds['preGenPo'])
            e.poId = preGenIds['preGenPo']; 
          if (preGenIds['preGenInv'])
            e.invoices.forEach(f => f.invoiceId = preGenIds['preGenInv'])
        });
      } else if (e === API.updatePaymentStatus && preGenIds['preGenInv']) {
        data.InvFin.forEach(e => {e.invoiceId = preGenIds['preGenInv'];});
      } else if (e === API.confirmInvoice && preGenIds['preGenInv']) {
        data.InvResult.forEach(e => {e.invoiceId = preGenIds['preGenInv'];});
      } 
    });
  }

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
    if (isShowBkdn)
      console.log(`[Test run ${run}][#${variant}] Starting (ts ${procStarts})${(!accessToken && useAuth) ? `, access token: ${token.substr(0, 70)}...` : '...'}`);

    // PO processing
    if (testRule.some(e => e === API.createPo)) {
      try {
        const writeStart = Date.now();
        const poIds = (isEnqOnly)?Array.from(new Set(data.PoCreate.map(d => d.poBaseInfo.poId))):await PerfTest.createPo(data.PoCreate);

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
          batchRes.tsRec[API.createPo] = {"id":poIds[0],"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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
          batchRes.tsRec[API.editPo] = {"id":editedPoIds[0],"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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
          batchRes.tsRec[API.cancelPo] = {"id":cancelledPoIds[0],"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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
          batchRes.tsRec[API.processPo] = {"id":processPoResult[0].poId,"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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
        const invIds = (isEnqOnly)?Array.from(new Set(data.InvCreate.map(d => d.invBaseInfo.invoiceId))):await PerfTest.createInvoice(data.InvCreate);

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
          batchRes.tsRec[API.createInvoice]  = {"id":invIds[0],"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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
          batchRes.tsRec[API.editInvoice] = {"id":editedInvIds[0],"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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
          batchRes.tsRec[API.transferInvoice] = {"id":notifiedInvIds[0],"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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
          batchRes.tsRec[API.confirmInvoice] = {"id":confirmInvResult[0].invoiceId,"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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

    if (testRule.some(e => e === API.updatePaymentStatus)) {
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
          batchRes.tsRec[API.updatePaymentStatus] = {"id":invFinInvIds[0],"callEndPtStart":writeStart, "callEndPtEnd": Date.now()};
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

    if (isShowBkdn) {
      if (useAuth) {
        console.log(
  `[Test run ${run}][#${variant}] Finished (ts ${runFinish}). E: ${elapsed}ms/${Math.round(totalElapsed/totalRuns)}s; A: ${auth}ms/${Math.round(totalAuth/totalRuns)}s; P: ${proc}ms/${Math.round(totalProc/totalRuns)}s; W: ${write}ms/${Math.round(totalWrite/totalRuns)}ms`
        );
      } else {
        console.log(
  `[Test run ${run}][#${variant}] Finished (ts ${runFinish}). Elapsed time: ${proc}ms/${Math.round(totalProc/totalRuns)}s; W: ${write}ms/${Math.round(totalWrite/totalRuns)}ms`
        );
      }
    }
    
    batchRes.res='resolve';

    // Grep ts from rl-org1
    if (!isEnqOnly) {
      await Promise.all(Object.keys(batchRes.tsRec).map(async (key, idx) => {
        return consolidTsWithSrv(key, batchRes.tsRec[key],idx);
      }))
        .then(values => {
          values.forEach( result => {
            batchRes.tsRec[result.apiStr] = Object.assign(batchRes.tsRec[result.apiStr], result.recTs);
          });
        })
        .catch(errors => {
          reject(errors);
        });
    } 

    resolve(batchRes);
  });
};


const consolidTsWithSrv = (apiStr:string, tsRec:{}, idx: number): Promise<{apiStr:string, recTs:{proxyReqStarts:number, proxyReqFinish:number, proxyResStarts:number, proxyResFinish:number, writeChainStart:number, writeChainFinish:number}}> => {

  return new Promise<{apiStr:string, recTs:{proxyReqStarts:number, proxyReqFinish:number, proxyResStarts:number, proxyResFinish:number, writeChainStart:number, writeChainFinish:number}}> ( async (resolve, reject) => {

    let maxRun:number = 3;
    let isStop:boolean = false;

    while (maxRun >= 1 && !isStop) {
      try {
        const {stdout, stderr} = await exec(`grep "PERFTEST\\].*${GrepLogCfg[apiStr].addSrhStrRegExp}.*${tsRec['id']}" ${GrepLogCfg[apiStr].logPath}`);
  
        if (stderr) {
          throw new Error(`error[${apiStr}-${idx}] : ${stderr}`);
        } else if (stdout) {
          const log = `${stdout}`;
          const json = JSON.parse(`{${log.replace('([sniffer] processNtt.js)','').substr(log.indexOf('"proxyReqStarts'))}`);
          const res = {'apiStr':apiStr,
            recTs:{
              'proxyReqStarts':json.proxyReqStarts,
              'proxyReqFinish':json.proxyReqFinish,
              'proxyResStarts':json.proxyResStarts,
              'proxyResFinish':json.proxyResFinish,
              'writeChainStart':json.writeChainStart,
              'writeChainFinish':json.writeChainFinish,
              'rl': `${parseInt(json.proxyResFinish)-parseInt(tsRec['callEndPtStart'])}`,
              'redis': `${parseInt(json.writeChainStart)-parseInt(json.proxyResFinish)}`,
              'chainOrg1': `${parseInt(json.writeChainFinish)-parseInt(json.writeChainStart)}`,
              'chainOrg3': `${parseInt(tsRec['callEndPtEnd'])-parseInt(json.writeChainFinish)}`,
              'ttl': `${parseInt(tsRec['callEndPtEnd'])-parseInt(tsRec['callEndPtStart'])}`
            }
          }
  
          // For Summary use
          rawData[apiStr]['rl'].push(parseInt(res.recTs.rl));
          rawData[apiStr]['rd'].push(parseInt(res.recTs.redis));
          rawData[apiStr]['o1'].push(parseInt(res.recTs.chainOrg1));
          rawData[apiStr]['o3'].push(parseInt(res.recTs.chainOrg3));

          resolve(res);
          isStop = true;
          break;
        }
      } catch(error) {
        if (--maxRun > 0 ) {
          console.log(`GrepLog error[${apiStr}-${idx}-retrying] : ${error}`);
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          isStop = true;
          reject(`error[${apiStr}-${idx}] : ${error}`);
        }
      }
    } 
  })
}

let runList:number[] = [];
const calFinalStat = (runIdx: number, cfg: PerfTestConfig): void => {
  runList.push(runIdx);
  if ((runList.length === cfg.RUNS) && Object.keys(rawData).length > 0) {
    testRule.forEach(e => {
      const rls = rawData[e].rl.sort(numSortfunc);
      const rds = rawData[e].rd.sort(numSortfunc);
      const o1s = rawData[e].o1.sort(numSortfunc);
      const o3s = rawData[e].o3.sort(numSortfunc);

      const pAvg_rl = rls.filter( (_, idx) => idx >= Math.round(rls.length*PT_LO/100)-1 && idx <= Math.round(rls.length*PT_HI/100)-1);
      const pAvg_rd = rds.filter( (_, idx) => idx >= Math.round(rds.length*PT_LO/100)-1 && idx <= Math.round(rds.length*PT_HI/100)-1);
      const pAvg_o1 = o1s.filter( (_, idx) => idx >= Math.round(o1s.length*PT_LO/100)-1 && idx <= Math.round(o1s.length*PT_HI/100)-1);
      const pAvg_o3 = o3s.filter( (_, idx) => idx >= Math.round(o3s.length*PT_LO/100)-1 && idx <= Math.round(o3s.length*PT_HI/100)-1);

      console.log(`[Summary][Perf Stat. of ${e} (${cfg.BATCH} REQ x${cfg.RUNS} BTH)] {`
      + `rl:{Min: ${Math.min.apply(Math, rls)}ms, Max: ${Math.max.apply(Math, rls)}ms, Avg: ${Math.round(rls.reduce((sum, cur) => sum+cur, 0) / rls.length)}ms, p${PT_LO}: ${percentile(rls, PT_LO)}ms, p${PT_HI}: ${percentile(rls, PT_HI)}ms, p_avg: ${Math.round(pAvg_rl.reduce((sum, cur) => sum+cur, 0) / pAvg_rl.length)}}`
      + `, redis:{Min: ${Math.min.apply(Math, rds)}ms, Max: ${Math.max.apply(Math, rds)}ms, Avg: ${Math.round(rds.reduce((sum, cur) => sum+cur, 0) / rds.length)}ms, p${PT_LO}: ${percentile(rds, PT_LO)}ms, p${PT_HI}: ${percentile(rds, PT_HI)}ms, p_avg: ${Math.round(pAvg_rd.reduce((sum, cur) => sum+cur, 0) / pAvg_rd.length)}}`
      + `, chainOrg1:{Min: ${Math.min.apply(Math, o1s)}ms, Max: ${Math.max.apply(Math, o1s)}ms, Avg: ${Math.round(o1s.reduce((sum, cur) => sum+cur, 0) / o1s.length)}ms, p${PT_LO}: ${percentile(o1s, PT_LO)}ms, p${PT_HI}: ${percentile(o1s, PT_HI)}ms, p_avg: ${Math.round(pAvg_o1.reduce((sum, cur) => sum+cur, 0) / pAvg_o1.length)}}`
      + `, chainOrg3:{Min: ${Math.min.apply(Math, o3s)}ms, Max: ${Math.max.apply(Math, o3s)}ms, Avg: ${Math.round(o3s.reduce((sum, cur) => sum+cur, 0) / o3s.length)}ms, p${PT_LO}: ${percentile(o3s, PT_LO)}ms, p${PT_HI}: ${percentile(o3s, PT_HI)}ms, p_avg: ${Math.round(pAvg_o3.reduce((sum, cur) => sum+cur, 0) / pAvg_o3.length)}}`
      + `}`
      );

    });
  }
}

// Start
(async () => {
  let index = 0;
  const cfg = PerfTest.defaultCfg;
  const { RUNS, BATCH, RUNS_WAIT, READ_WAIT, stamp, range, authOn, READ_RETRY, ... OTH_CFG } = cfg;

  //Validation
  if (testRule.length === 0) {
    console.log('Invalid FAB_TEST_RULE value, suport: ['+ Object.keys(TestRules)+']');
    return;
  }

  console.log(`Running ${RUNS} x ${BATCH} relay tests (${RUNS_WAIT}s, ${READ_WAIT}ms x ${READ_RETRY})...`);
  totalElapsed = 0;
  totalAuth = 0;
  totalProc = 0;
  totalWrite = 0;
  totalRuns = 0;

  testRule.forEach(api => {rawData[api] = {rl:[],rd:[],o1:[],o3:[]};});
  
  lastElapsedTimes.splice(0, lastElapsedTimes.length);
  
  if (cfg.STATS_DATA) {
    try {
      fs.accessSync(cfg.STATS_DATA, fs.constants.F_OK);
      fs.unlinkSync(cfg.STATS_DATA);
    } catch (err) {
      if (!err.message.includes('no such file')) console.log(err);
    }
  }

  //Pre Gen PO & Inv
  if (isPreGenId) {
    await preRunTest('PRE', 0, `${stamp}PREGEN`, (authOn === 'no')?false:true);
  }

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

    if (cfg.STATS_DATA) {
      const d = new Date();
      const dttm = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
      fs.writeFile(cfg.STATS_DATA, `${dttm.substring(0, 10)} ${dttm.substring(11, 19)}|${runsWait}\n`, { flag: 'a' }, err => {
        if (err) console.log('Error writing statistic data file', err);
      });
    }

    let token;
    if (authOn === 'less') {
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
      .then(async (values) => {

        
        // Print Breakdown
        if (isShowBkdn) {
          values.forEach( batchRes => {
            console.log(`[Test run ${run}][Breakdown]` + JSON.stringify(batchRes));
          });
        }

        // Calculate and Print Stat.
        if (!isEnqOnly) {
          testRule.forEach(e => {

            const rlRawData = values.map( o=> parseInt(o.tsRec[e].rl));
            const rdRawData = values.map( o=> parseInt(o.tsRec[e].redis));
            const o1RawData = values.map( o=> parseInt(o.tsRec[e].chainOrg1));
            const o3RawData = values.map( o=> parseInt(o.tsRec[e].chainOrg3));

            console.log(`[Test run ${run}][Perf Stat. of ${e}]`
            + `NoTrans: ${values.length}`
            + `, rl:{Min: ${Math.min.apply(Math, rlRawData)}ms, Max: ${Math.max.apply(Math, rlRawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt((cur.tsRec[e].rl)), 0) / values.length)}ms, p${PT_HI}: ${percentile(rlRawData.sort(numSortfunc), PT_HI)}ms}`
            + `, redis:{Min: ${Math.min.apply(Math, rdRawData)}ms, Max: ${Math.max.apply(Math, rdRawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].redis), 0) / values.length)}ms, p${PT_HI}: ${percentile(rdRawData.sort(numSortfunc), PT_HI)}ms}`
            + `, chainOrg1:{Min: ${Math.min.apply(Math, o1RawData)}ms, Max: ${Math.max.apply(Math, o1RawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].chainOrg1), 0) / values.length)}ms, p${PT_HI}: ${percentile(o1RawData.sort(numSortfunc), PT_HI)}ms}`
            + `, chainOrg3:{Min: ${Math.min.apply(Math, o3RawData)}ms, Max: ${Math.max.apply(Math, o3RawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].chainOrg3), 0) / values.length)}ms, p${PT_HI}: ${percentile(o3RawData.sort(numSortfunc), PT_HI)}ms}`
            );

          });
        } else {
          testRule.forEach(e => {
            console.log(`[Test run ${run}][Perf Stat. of ${process.env.FAB_TEST_RULE}]`
            + ` NoTrans: ${values.length}, Min: ${Math.min.apply(Math, values.map(function(o) { return (o.tsRec[e].callEndPtEnd-o.tsRec[e].callEndPtStart); }))}ms, Max: ${Math.max.apply(Math, values.map(function(o) { return (o.tsRec[e].callEndPtEnd-o.tsRec[e].callEndPtStart); }))}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+(parseInt(cur.tsRec[e].callEndPtEnd) - parseInt(cur.tsRec[e].callEndPtStart)), 0) / values.length)}ms`
            );
          });
        }

        // Promise.all will resolve only if all promises resolved
        if (authOn === 'less') {
          console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Completed: ${values.length} (A: ${Math.round(totalAuth/(i+1))}s)`);
        } else {
          console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Completed: ${values.length}`);
        }

        calFinalStat(i , cfg);
      })
      .catch(errors => {
        console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Error: ${errors}`);
      });

    if ((i+1) < RUNS) {
      await new Promise(resolve => setTimeout(resolve, runsWait * 1000));
    } 
  }
})();
