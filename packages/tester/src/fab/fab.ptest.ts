require('dotenv').config({ path: './.env' });
import { Console, exception } from 'console';
import fs from 'fs';
import https from 'https';
import { curry } from 'lodash';
import fetch from 'node-fetch';
import { getTestData } from '../relay/mockUtils';
import { PerfTest, API } from './ptest';
const util = require('util');
const exec = util.promisify(require('child_process').exec);


let totalElapsed = 0;
let totalAuth = 0;
let totalProc = 0;
let totalWrite = 0;
let totalRuns = 0;

enum DocId {
  po = "poId",
  inv = "invoiceId",
}

interface runTestResult {
  res:string,
  uid:string,
  tsRec:{[k:string]:any},
}

const GrepLogCfg:{[key in keyof typeof API]: {addSrhStrRegExp:string, logPath:string}} = {
  [API.createInvoice]:        { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[4]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG1_LOG_PATH || './log/all.log'),
                              },
  [API.editInvoice]:          { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[4]}\\",\\"method\\":\\"PUT\\"`,
                                logPath:(process.env.RL_ORG1_LOG_PATH || './log/all.log'),
                              },
  [API.transferInvoice]:      { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[5]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG1_LOG_PATH || './log/all.log'),
                              },
  [API.confirmInvoice]:       { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[7]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                              },
  [API.updatePaymentStatus]:  { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[8]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                              },
  [API.createPo]:             { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[1]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                              },
  [API.editPo]:               { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[1]}\\",\\"method\\":\\"PUT\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                              },
  [API.cancelPo]:             { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[2]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG2_LOG_PATH || './log/all.log'),
                              },
  [API.processPo]:            { addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[3]}\\",\\"method\\":\\"POST\\"`,
                                logPath: (process.env.RL_ORG1_LOG_PATH || './log/all.log'),
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
                      // , rules:[API.processPo]}, 
  createInvoice:      { preGenId:[DocId.po]
                      , rules:[API.createInvoice]},  
  // editInvoice:        { preGenId:['po','inv']
  //                     , rules:[API.editInvoice]},
  transferInvoice:    { preGenId:[DocId.po, DocId.inv]
                      , rules:[API.transferInvoice]},
  // confirmInvoice:     { preGenId:['po','inv']
  //                     , rules:[API.confirmInvoice]},
  updatePaymentStatus:{ preGenId:[DocId.po, DocId.inv]
                      , rules:[API.updatePaymentStatus]},
  all:                { preGenId:[]
                      , rules:[API.createPo, API.editPo, API.cancelPo, API.processPo, API.createInvoice, API.editInvoice, API.transferInvoice, API.confirmInvoice, API.updatePaymentStatus]},
}

const cfgTestRun = TestRules[process.env.FAB_TEST_RULE || 'all'];
const isPreGenId = cfgTestRun? (cfgTestRun.preGenId.length > 0) : false;
const testRule = cfgTestRun?cfgTestRun.rules : [];
const lastElapsedTimes = [];

let preGenIds = {};

const preRunTest = (run: string, index: number, variant: string, useAuth: boolean, accessToken?: string) => {
  const data = getTestData(variant);
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
    // console.log(`[Test run ${run}][#${variant}] Starting (ts ${procStarts})${(!accessToken && useAuth) ? `, access token: ${token.substr(0, 70)}...` : '...'}`);

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
  const data = getTestData(variant);

  if (isPreGenId) {
    testRule.forEach (e => {
      if (e === API.createInvoice) {
        data.InvCreate.forEach(e => e.invBaseInfo.poId = preGenIds['preGenPo']);  
      } else if (e === API.transferInvoice) {
        data.InvNotify.forEach(e => {e.poId = preGenIds['preGenPo']; e.invoices.forEach(f => f.invoiceId = preGenIds['preGenInv'])});
      } else if (e === API.updatePaymentStatus) {
        data.InvFin.forEach(e => {e.invoiceId = preGenIds['preGenInv'];});
      }
    });
  }

  let batchRes:runTestResult ={
    res:'reject',
    uid:variant,
    tsRec:{},
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

    if (useAuth) {
      console.log(
`[Test run ${run}][#${variant}] Finished (ts ${runFinish}). E: ${elapsed}ms/${Math.round(totalElapsed/totalRuns)}s; A: ${auth}ms/${Math.round(totalAuth/totalRuns)}s; P: ${proc}ms/${Math.round(totalProc/totalRuns)}s; W: ${write}ms/${Math.round(totalWrite/totalRuns)}ms`
      );
    } else {
      console.log(
`[Test run ${run}][#${variant}] Finished (ts ${runFinish}). Elapsed time: ${proc}ms/${Math.round(totalProc/totalRuns)}s; W: ${write}ms/${Math.round(totalWrite/totalRuns)}ms`
      );
    }
    
    batchRes.res='resolve';

    // Grep ts from rl-org1
    await Promise.all(Object.keys(batchRes.tsRec).map(async (key, idx) =>{
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

    resolve(batchRes);
  });
};


const consolidTsWithSrv = (apiStr:string, tsRec:{}, idx: number): Promise<{apiStr:string, recTs:{proxyReqStarts:number, proxyReqFinish:number, proxyResStarts:number, proxyResFinish:number, writeChainStart:number, writeChainFinish:number}}> => {

  return new Promise<{apiStr:string, recTs:{proxyReqStarts:number, proxyReqFinish:number, proxyResStarts:number, proxyResFinish:number, writeChainStart:number, writeChainFinish:number}}> ( async (resolve, reject) => {
    try {
      const {stdout, stderr} = await exec(`grep "PERFTEST\\].*${GrepLogCfg[apiStr].addSrhStrRegExp}.*${tsRec['id']}" ${GrepLogCfg[apiStr].logPath}`);

      if (stderr) {
        reject(`error[${apiStr}-${idx}] : ${stderr}`);
      } else if (stdout) {
        const log = `${stdout}`;
        try {
          const json = JSON.parse(`{${log.replace('([sniffer] processNtt.js)','').substr(log.indexOf('"proxyReqStarts'))}`);
          const res = {'apiStr':apiStr,
            recTs:{
              'proxyReqStarts':json.proxyReqStarts,
              'proxyReqFinish':json.proxyReqFinish,
              'proxyResStarts':json.proxyResStarts,
              'proxyResFinish':json.proxyResFinish,
              'writeChainStart':json.writeChainStart,
              'writeChainFinish':json.writeChainFinish,
              'rl': `${json.proxyResFinish-tsRec['callEndPtStart']}`,
              'redis': `${json.writeChainStart-json.proxyResFinish}`,
              'chainOrg1': `${json.writeChainFinish-json.writeChainStart}`,
              'chainOrg3': `${tsRec['callEndPtEnd']-json.writeChainFinish}`,
              'ttl': `${tsRec['callEndPtEnd']-tsRec['callEndPtStart']}`
            }
          }
  
          resolve(res);
        } catch (error) {
          console.log(`Internal error[${apiStr}-${idx}] grep : ${log}`);
          throw error;
        }
      }
    } catch(error) {
      console.log(`Internal error[${apiStr}-${idx}] : ${error}`);
      reject(`error[${apiStr}-${idx}] : ${error}`);
    }
  })
}


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
  const authOn = cfg.authOn;
  const READ_RETRY = cfg.READ_RETRY;

  //Validation
  if (testRule.length === 0) {
    console.log('Invalid FAB_TEST_RULE value, suport: ['+ Object.keys(TestRules)+']');
    return;
  }

  console.log(`Running ${RUNS} x ${BATCH} relay tests (${RUNS_WAIT}ms, ${READ_WAIT}ms x ${READ_RETRY})...`);
  totalElapsed = 0;
  totalAuth = 0;
  totalProc = 0;
  totalWrite = 0;
  totalRuns = 0;
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
        values.forEach( batchRes => {
          console.log(`[Test run ${run}][Breakdown]` + JSON.stringify(batchRes));
        });
        
        // Calculate and Print Stat.
        testRule.forEach(e => {
          console.log(`[Test run ${run}][Stat. of ${e}]`
          + ` rl:{Min: ${Math.min.apply(Math, values.map(function(o) { return o.tsRec[e].rl; }))}ms, Max: ${Math.max.apply(Math, values.map(function(o) { return o.tsRec[e].rl; }))}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt((cur.tsRec[e].rl)), 0) / values.length)}ms}`
          + ` redis:[Min: ${Math.min.apply(Math, values.map(function(o) { return o.tsRec[e].redis; }))}ms, Max: ${Math.max.apply(Math, values.map(function(o) { return o.tsRec[e].redis; }))}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].redis), 0) / values.length)}ms}`
          + ` chainOrg1:[Min: ${Math.min.apply(Math, values.map(function(o) { return o.tsRec[e].chainOrg1; }))}ms, Max: ${Math.max.apply(Math, values.map(function(o) { return o.tsRec[e].chainOrg1; }))}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].chainOrg1), 0) / values.length)}ms}`
          + ` chainOrg3:[Min: ${Math.min.apply(Math, values.map(function(o) { return o.tsRec[e].chainOrg3; }))}ms, Max: ${Math.max.apply(Math, values.map(function(o) { return o.tsRec[e].chainOrg3; }))}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].chainOrg3), 0) / values.length)}ms}`
          );
        });

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
