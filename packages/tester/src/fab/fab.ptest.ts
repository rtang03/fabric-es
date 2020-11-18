require('dotenv').config({ path: './.env' });
import fs from 'fs';
import { getTestData, genTestData } from '../relay/mockUtils';
import { PerfTest, API, PerfTestConfig } from './ptest';
import percentile from 'stats-percentile';
const os = require('os');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const enum DocId {
  po = "poId",
  inv = "invoiceId",
}

interface runTestResult {
  res:string,
  uid:string,
  tsRec:{[k:string]:any},
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


let totalElapsed = 0;
let totalAuth = 0;
let totalProc = 0;
let totalWrite = 0;
let totalRuns = 0;
let MaxRuns = 0;
let initSvrLogLineCnt:{} = {};
// let grepLogs:{rl1:string[], rl2:string[]} = {rl1:[], rl2:[]};

const cfgTestRun = TestRules[process.env.FAB_TEST_RULE || 'all'];
const isPreGenId = cfgTestRun? (cfgTestRun.preGenId.length > 0) : false;
const testRule:API[] = cfgTestRun?cfgTestRun.rules : [];
const isEnqOnly = cfgTestRun? (cfgTestRun.isEnqOnly || false):false;
const lastElapsedTimes = [];
const isShowBkdn:boolean = (process.env.FAB_SHOW_BKDN || 'true') === "true";
const PT_HI:number = parseInt(process.env.FAB_PERCENTILE_HI_VAL || '100');
const PT_LO:number = parseInt(process.env.FAB_PERCENTILE_LO_VAL || '0');
const NUM_DOC_IN_REQ_DATA = parseInt(process.env.FAB_REQ_DATA_SIZE || '2');
const numSortfunc = function (a,b) {return a-b};
let tailProc:any = {};

let preGenIds = {};

interface IApiCfg {
  GrepLogCfg: {   addSrhStrRegExp:string
                , logPath:string
                , dataType:String
              };
  RunTestCfg: {
                  submitRequest(data:any, frmPerGen:boolean) : string[] | Promise<any>
                , checkEntity(tag:string, token:string, p:any, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) : Promise<any>
                , tag:string
              }
}

class ProcSetting {

  static rlLogPath = { rl1: (process.env.RL_ORG1_LOG_PATH || './log/all.log'), rl2: (process.env.RL_ORG2_LOG_PATH || './log/all.log')};

  static ApiCfg:{[k in keyof typeof API]:IApiCfg} = {
    [API.createInvoice]:    { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[4]}\\",\\"method\\":\\"POST\\"`,
                                logPath: 'rl1',
                                dataType: "InvCreate",
                              },
                              RunTestCfg: {
                                submitRequest: (data:any, frmPerGenFun?:boolean) => (isEnqOnly && !frmPerGenFun)?Array.from(new Set(data.InvCreate.map(d => d.invBaseInfo.invoiceId))):PerfTest.createInvoice(data.InvCreate),
                                checkEntity: (tag:string, token:string, p:string, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p),
                                tag: "Create Invoices",
                              }                         
                            },
    [API.editInvoice]:      { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[4]}\\",\\"method\\":\\"PUT\\"`,
                                logPath:'rl1',
                                dataType: 'InvEdit',
                              },
                              RunTestCfg: {
                                submitRequest: (data:any) => PerfTest.editInvoice(data.InvEdit),
                                checkEntity: (tag:string, token:string, p:string, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p, (results: any[]) => results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":1`) >= 0)), true)),
                                tag: "Edit Invoices",
                              }                         
                            },
    [API.transferInvoice]:  { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[5]}\\",\\"method\\":\\"POST\\"`,
                                logPath: 'rl1',
                                dataType: 'InvNotify',
                              },
                              RunTestCfg: {
                                submitRequest: (data:any) => PerfTest.transferInvoice(data.InvNotify),
                                checkEntity: (tag:string, token:string, p:string, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p, (results: any[]) => results.reduce((accu, r) => (accu && (r.value.indexOf(`,InvoiceTransferred`) >= 0)), true)),
                                tag: "Transfer Invoices",
                              }                         
                            },
    [API.confirmInvoice]:  { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[7]}\\",\\"method\\":\\"POST\\"`,
                                logPath: 'rl2',
                                dataType: 'InvResult',
                              },
                              RunTestCfg: {
                                submitRequest: (data:any) => PerfTest.confirmInvoice(data.InvResult),
                                checkEntity: (tag:string, token:string, p:{invoiceId: string,actionResponse: string;}, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p.invoiceId, (results: any[]) => results.reduce((accu, r) => { return ( accu && p.actionResponse === '1' ? (r.value.indexOf(`"status":2`) >= 0) : (r.value.indexOf(`"status":3`) >= 0));}, true)),
                                tag: "Confirm Invoices",
                              }                         
                            },
    [API.updatePaymentStatus]:  { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[8]}\\",\\"method\\":\\"POST\\"`,
                                logPath: 'rl2',
                                dataType: 'InvFin',
                              },
                              RunTestCfg: {
                                submitRequest: (data:any) => PerfTest.updatePaymentStatus(data.InvFin),
                                checkEntity: (tag:string, token:string, p:string, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p, (results: any[]) => results.reduce((accu, r) => (accu && (r.value.indexOf(`,PaymentStatusUpdated`) >= 0)), true)),
                                tag: "Update payment status",
                              }                         
                            },
    [API.createPo]:         { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[1]}\\",\\"method\\":\\"POST\\"`,
                                logPath: 'rl2',
                                dataType: 'PoCreate',
                              },
                              RunTestCfg: {
                                submitRequest: (data:any, frmPerGenFun?:boolean) => (isEnqOnly && !frmPerGenFun)?Array.from(new Set(data.PoCreate.map(d => d.poBaseInfo.poId))):PerfTest.createPo(data.PoCreate),
                                checkEntity: (tag:string, token:string, p:string, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p),
                                tag: "Create POs",
                              }                         
                            },
    [API.editPo]:           { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[1]}\\",\\"method\\":\\"PUT\\"`,
                                logPath: 'rl2',
                                dataType: 'PoEdit',
                              },
                              RunTestCfg: {
                                submitRequest: (data:any) => PerfTest.editPo(data.PoEdit),
                                checkEntity: (tag:string, token:string, p:string, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p, (results: any[]) => results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":1`) >= 0)), true)),
                                tag: "Edit POs",
                              }                         
                            },
    [API.cancelPo]:         { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[2]}\\",\\"method\\":\\"POST\\"`,
                                logPath: 'rl2',
                                dataType: 'PoCancel',
                              },
                              RunTestCfg: {
                                submitRequest: (data:any) => PerfTest.cancelPo(data.PoCancel),
                                checkEntity: (tag:string, token:string, p:string, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p, (results: any[]) => results.reduce((accu, r) => (accu && (r.value.indexOf(`"status":4`) >= 0)), true)),
                                tag: "Cancel POs",
                              }                         
                            },
    [API.processPo]:         { 
                              GrepLogCfg:  {
                                addSrhStrRegExp: `\\"endPoint\\":\\"${PerfTest.defaultCfg.EndPoints[3]}\\",\\"method\\":\\"POST\\"`,
                                logPath: 'rl1',
                                dataType: 'PoProcess',
                              },
                              RunTestCfg: {
                                submitRequest: (data:any) => PerfTest.processPo(data.PoProcess),
                                checkEntity: (tag:string, token:string, p:{poId:string; actionResponse:string}, expected?: (results: any[]) => boolean, pTestConfig?: PerfTestConfig) => 
                                      PerfTest.readEntities(tag, token, p.poId, (results: any[]) => results.reduce((accu, r) => {return (accu && p.actionResponse === '1' ? (r.value.indexOf(`"status":2`) >= 0) : (r.value.indexOf(`"status":3`) >= 0));}, true)),
                                tag: "Process POs",
                              }                         
                            },
    }

}

const reqCaller = (apiCfg: IApiCfg, data:any, token:string, run:string, variant:string, index:number, frmPerGen?:boolean, batchRes?:runTestResult) => {

  return new Promise<{ids:string[], callEndPtStart:number, callEndPtEnd:number, reqSubmElapsed:number}> ( async (resolve, reject) => {
    const writeStart = Date.now();
    let write = 0;
    const rtnObj = apiCfg.RunTestCfg.submitRequest;
  
    try {
      const objIds:string[] = (rtnObj instanceof Array)? rtnObj: await rtnObj(data, frmPerGen);
  
      if (objIds && (objIds !== undefined)) {
        write += (Date.now() - writeStart);
        const shouldContinue = await Promise.all(objIds.map(async p =>
          apiCfg.RunTestCfg.checkEntity(`[Test run ${run}][#${variant}] ${apiCfg.RunTestCfg.tag}`, token, p)
            .then(_ => true)
            .catch(error => console.log(`[Test run ${run}][#${variant}] ${apiCfg.RunTestCfg.tag} ${error}`))
        ));

        if (!shouldContinue.reduce((a, c) => a && c, true)) {
          console.log(`[Test run ${run}][#${variant}] ${apiCfg.RunTestCfg.tag} stopped. Reading ${apiCfg.RunTestCfg.tag} failed`);
          reject(index);
          return;
        }

        resolve({"ids": objIds, "callEndPtStart":writeStart, "callEndPtEnd": Date.now(), "reqSubmElapsed": write});
      } else {
        console.log(`[Test run ${run}][#${variant}] ERROR! ${apiCfg.RunTestCfg.tag} failed`);
        reject(index);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${variant}] ${apiCfg.RunTestCfg.tag} throws ${error}`);
      reject(index);
      return;
    }
  })
};

const preRunTest = (run: string, index: number, variant: string, useAuth: boolean, accessToken?: string) => {

  const data = genTestData(variant, ['PoCreate','InvCreate']);
  const genIds = TestRules[process.env.FAB_TEST_RULE || 'all'].preGenId;

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
        reject(index);accessToken
        return;
      }
    } else {
      token = accessToken;
    }

    for (const e of genIds) {
      let apiCfg:IApiCfg;
      if (e === DocId.po) {
        preGenIds['preGenPo'] = data.PoCreate[0].poBaseInfo.poId;
        apiCfg = ProcSetting.ApiCfg.createPo;
      } else if (e === DocId.inv) {
        preGenIds['preGenInv'] = data.InvCreate[0].invBaseInfo.invoiceId;
        apiCfg = ProcSetting.ApiCfg.createInvoice;
      }

      if (apiCfg) {
        await reqCaller(apiCfg, data, token, run, variant, index, true)
        .then(_ => true)
        .catch(error => {
          reject(index);
          return;
        });
      } else {
        console.log(`Unknown DocId value : ${e}`)
        reject(index);
        return;
      }
    }

    resolve();
  });
};

const runTest = (run: string, index: number, variant: string, useAuth: boolean, accessToken?: string) => {

  const dataType = cfgTestRun.rules.map(e => ProcSetting.ApiCfg[e].GrepLogCfg.dataType);
  const data = (typeof cfgTestRun.usePerfTestData === 'undefined' || cfgTestRun.usePerfTestData) ? genTestData(variant, dataType, NUM_DOC_IN_REQ_DATA) : getTestData(variant);

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

    for (const e of testRule) {
      try {
        await reqCaller(ProcSetting.ApiCfg[e], data, token, run, variant, index, false)
        .then(rtn => {
          write += rtn.reqSubmElapsed;
          delete rtn.reqSubmElapsed;
          batchRes.tsRec[e] = rtn;
        })
        .catch(error => {
          reject(index);
          return;  
        });
      } catch (error){
        console.log(`[Test run ${run}][#${variant}] ${ProcSetting.ApiCfg[e]} throws ${error}`);
        reject(index);
        return;
      };
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

    // For controlling grep resource process
    isAllRun();

    resolve(batchRes);
  });
};

const getTsRecFrSvr = (apiStr:string, resObjs:runTestResult[], run:string): Promise<void> => {
  return new Promise<void> ( async (resolve, reject) => {
    let maxRun:number = parseInt(process.env.FAB_GREP_MAX_RUN || '5');
    let isStop:boolean = false;

    while (maxRun-- >= 1 && !isStop) {
      const ids = resObjs.filter( r => !r.tsRec[apiStr].proxyReqStarts || r.tsRec[apiStr].proxyReqStarts === undefined);

      if (ids === undefined || ids.length === 0) {
        isStop = true;
        resolve();
        break;
      } else {
        try {
          if (maxRun <= 0) {
            throw new Error(`Reach Max Run`);
          }

          const grepCmd = `tail -n +${initSvrLogLineCnt[run][ProcSetting.ApiCfg[apiStr].GrepLogCfg.logPath]} ${ProcSetting.rlLogPath[ProcSetting.ApiCfg[apiStr].GrepLogCfg.logPath]} | grep "PERFTEST\\].*${ProcSetting.ApiCfg[apiStr].GrepLogCfg.addSrhStrRegExp}.*processNtt\\.js)$"`;
          const {stdout, stderr} = await exec(grepCmd);

          if (stderr) {
            throw new Error(`error[${apiStr}-${run}] : ${stderr}`);
          } else if (stdout) {
            const grepLogs = `${stdout}`.toString().split(os.EOL);
            if (grepLogs !== undefined && grepLogs.length > 0) {
              resObjs.forEach( res => {
                const logs = grepLogs.filter(s => s.trim().match(`${res.tsRec[apiStr]['ids'][0]}.*processNtt\\.js\\)$`));
                if (logs !== undefined && logs.length > 0) {
                  const log = logs[0].trim();
                  const json = JSON.parse(`{${log.replace('([sniffer] processNtt.js)','').substr(log.indexOf('"proxyReqStarts'))}`);
                  res.tsRec[apiStr].proxyReqStarts = json.proxyReqStarts;
                  res.tsRec[apiStr].proxyReqFinish = json.proxyReqFinish;
                  res.tsRec[apiStr].proxyResStarts = json.proxyResStarts;
                  res.tsRec[apiStr].proxyResFinish = json.proxyResFinish;
                  res.tsRec[apiStr].writeChainStart = json.writeChainStart;
                  res.tsRec[apiStr].writeChainFinish = json.writeChainFinish;
                }
              });  
            }
          }

        } catch(error) {
          if (maxRun > 0 ) {
            console.log(`GrepLog error[${apiStr}-${run}-retrying] : ${error}`);
          } else {
            isStop = true;
            reject(`[${apiStr}-${run}] : Not found ids ${JSON.stringify(ids)}`);
          }
        } finally { await new Promise(resolve => setTimeout(resolve, 1000)); };
      }
    }
  })
}

let runList:{batch:number[],res:runTestResult[][]}  = {batch:[],res:[]};
const isAllRun = ():void => {
    if (totalRuns >= MaxRuns) {
      console.log(`[Test run ctrl] ALL_BATCH_DONE`);
    }
}

const calSummaryStat = (runIdx: number, cfg: PerfTestConfig, batchRes?: runTestResult[] ): void => {
  runList.batch.push(runIdx);
  if (batchRes)
    runList.res.push(batchRes);

  if ((runList.batch.length === cfg.RUNS)) {

    if (isEnqOnly) {
      testRule.forEach(e => {
        const cls =  [].concat(...runList.res.map (o => o.map(g => g.tsRec[e].callEndPtEnd - g.tsRec[e].callEndPtStart))).sort(numSortfunc);
        const pAvg_cl = cls.filter( (_, idx) => idx >= Math.round(cls.length*PT_LO/100)-1 && idx <= Math.round(cls.length*PT_HI/100)-1);
        
        console.log(`[Summary][Perf Stat. of ${process.env.FAB_TEST_RULE} ( ${NUM_DOC_IN_REQ_DATA} DOCS X ${cfg.BATCH} BTH x ${cfg.RUNS} RUN )]`
        + ` Min: ${Math.min.apply(Math, cls)}ms, Max: ${Math.max.apply(Math, cls)}ms, Avg: ${Math.round(cls.reduce((sum, cur) => sum+cur, 0) / cls.length)}ms, p${PT_LO}: ${percentile(cls, PT_LO)}ms, p${PT_HI}: ${percentile(cls, PT_HI)}ms, p_avg: ${Math.round(pAvg_cl.reduce((sum, cur) => sum+cur, 0) / pAvg_cl.length)}ms}`
        );
      });
    } else {
      testRule.forEach(e => {

        // Prepare "Per Request" records
        const rls = [].concat.apply([],runList.res.map( f => f.map(g => g.tsRec[e].rl))).sort(numSortfunc);
        const rds = [].concat.apply([],runList.res.map( f => f.map(g => g.tsRec[e].redis))).sort(numSortfunc);
        const o1s = [].concat.apply([],runList.res.map( f => f.map(g => g.tsRec[e].chainOrg1))).sort(numSortfunc);
        const o3s = [].concat.apply([],runList.res.map( f => f.map(g => g.tsRec[e].chainOrg3))).sort(numSortfunc);

        const pAvg_rl = rls.filter( (_: any, idx: number) => idx >= Math.round(rls.length*PT_LO/100)-1 && idx <= Math.round(rls.length*PT_HI/100)-1);
        const pAvg_rd = rds.filter( (_: any, idx: number) => idx >= Math.round(rds.length*PT_LO/100)-1 && idx <= Math.round(rds.length*PT_HI/100)-1);
        const pAvg_o1 = o1s.filter( (_: any, idx: number) => idx >= Math.round(o1s.length*PT_LO/100)-1 && idx <= Math.round(o1s.length*PT_HI/100)-1);
        const pAvg_o3 = o3s.filter( (_: any, idx: number) => idx >= Math.round(o3s.length*PT_LO/100)-1 && idx <= Math.round(o3s.length*PT_HI/100)-1);

        // Prepare "Per Batch" records
        const ttlUse_rls = runList.res.map( f => Math.max.apply(Math, f.map( g => g.tsRec[e].proxyResFinish)) - Math.min.apply(Math, f.map(g => g.tsRec[e].callEndPtStart))).sort(numSortfunc);
        const ttlUse_rds = runList.res.map( f => Math.min.apply(Math, f.map( g => g.tsRec[e].writeChainStart)) - Math.min.apply(Math, f.map(g => g.tsRec[e].proxyResFinish))).sort(numSortfunc);
        const ttlUse_o1s = runList.res.map( f => Math.max.apply(Math, f.map( g => g.tsRec[e].writeChainFinish)) - Math.min.apply(Math, f.map(g => g.tsRec[e].writeChainStart))).sort(numSortfunc);
        const ttlUse_o3s = runList.res.map( f => Math.max.apply(Math, f.map( g => g.tsRec[e].callEndPtEnd)) - Math.min.apply(Math, f.map(g => g.tsRec[e].writeChainFinish))).sort(numSortfunc);

        const pAvg_ttlUse_rl = ttlUse_rls.filter( (_, idx) => idx >= Math.round(ttlUse_rls.length*PT_LO/100)-1 && idx <= Math.round(ttlUse_rls.length*PT_HI/100)-1);
        const pAvg_ttlUse_rd = ttlUse_rds.filter( (_, idx) => idx >= Math.round(ttlUse_rds.length*PT_LO/100)-1 && idx <= Math.round(ttlUse_rds.length*PT_HI/100)-1);
        const pAvg_ttlUse_o1 = ttlUse_o1s.filter( (_, idx) => idx >= Math.round(ttlUse_o1s.length*PT_LO/100)-1 && idx <= Math.round(ttlUse_o1s.length*PT_HI/100)-1);
        const pAvg_ttlUse_o3 = ttlUse_o3s.filter( (_, idx) => idx >= Math.round(ttlUse_o3s.length*PT_LO/100)-1 && idx <= Math.round(ttlUse_o3s.length*PT_HI/100)-1);

        // Print Stat.
        console.log(`[Summary][Perf Stat. of ${e} ( ${NUM_DOC_IN_REQ_DATA} DOCS X ${cfg.BATCH} BTH x ${cfg.RUNS} RUN ), total ${runList.res.length} batch run]`
        + `{`
        +   `byREQ:{`
        +    `rl:{Min: ${Math.min.apply(Math, rls)}ms, Max: ${Math.max.apply(Math, rls)}ms, Avg: ${Math.round(rls.reduce((sum, cur) => sum+cur, 0) / rls.length)}ms, p${PT_LO}: ${percentile(rls, PT_LO)}ms, p${PT_HI}: ${percentile(rls, PT_HI)}ms, p_avg: ${Math.round(pAvg_rl.reduce((sum, cur) => sum+cur, 0) / pAvg_rl.length)}ms}`
        +     `, redis:{Min: ${Math.min.apply(Math, rds)}ms, Max: ${Math.max.apply(Math, rds)}ms, Avg: ${Math.round(rds.reduce((sum, cur) => sum+cur, 0) / rds.length)}ms, p${PT_LO}: ${percentile(rds, PT_LO)}ms, p${PT_HI}: ${percentile(rds, PT_HI)}ms, p_avg: ${Math.round(pAvg_rd.reduce((sum, cur) => sum+cur, 0) / pAvg_rd.length)}ms}`
        +     `, chainOrg1:{Min: ${Math.min.apply(Math, o1s)}ms, Max: ${Math.max.apply(Math, o1s)}ms, Avg: ${Math.round(o1s.reduce((sum, cur) => sum+cur, 0) / o1s.length)}ms, p${PT_LO}: ${percentile(o1s, PT_LO)}ms, p${PT_HI}: ${percentile(o1s, PT_HI)}ms, p_avg: ${Math.round(pAvg_o1.reduce((sum, cur) => sum+cur, 0) / pAvg_o1.length)}ms}`
        +     `, chainOrg3:{Min: ${Math.min.apply(Math, o3s)}ms, Max: ${Math.max.apply(Math, o3s)}ms, Avg: ${Math.round(o3s.reduce((sum, cur) => sum+cur, 0) / o3s.length)}ms, p${PT_LO}: ${percentile(o3s, PT_LO)}ms, p${PT_HI}: ${percentile(o3s, PT_HI)}ms, p_avg: ${Math.round(pAvg_o3.reduce((sum, cur) => sum+cur, 0) / pAvg_o3.length)}ms}`
        +   `}`
        + `, byBTH:{`
        +     `rl:{Min: ${Math.min.apply(Math, ttlUse_rls)}ms, Max: ${Math.max.apply(Math, ttlUse_rls)}ms, Avg: ${Math.round(ttlUse_rls.reduce((sum, cur) => sum+cur, 0) / ttlUse_rls.length)}ms, p${PT_LO}: ${percentile(ttlUse_rls, PT_LO)}ms, p${PT_HI}: ${percentile(ttlUse_rls, PT_HI)}ms, p_avg: ${Math.round(pAvg_ttlUse_rl.reduce((sum, cur) => sum+cur, 0) / pAvg_ttlUse_rl.length)}ms}`
        +     `, redis:{Min: ${Math.min.apply(Math, ttlUse_rds)}ms, Max: ${Math.max.apply(Math, ttlUse_rds)}ms, Avg: ${Math.round(ttlUse_rds.reduce((sum, cur) => sum+cur, 0) / ttlUse_rds.length)}ms, p${PT_LO}: ${percentile(ttlUse_rds, PT_LO)}ms, p${PT_HI}: ${percentile(ttlUse_rds, PT_HI)}ms, p_avg: ${Math.round(pAvg_ttlUse_rd.reduce((sum, cur) => sum+cur, 0) / pAvg_ttlUse_rd.length)}ms}`
        +     `, chainOrg1:{Min: ${Math.min.apply(Math, ttlUse_o1s)}ms, Max: ${Math.max.apply(Math, ttlUse_o1s)}ms, Avg: ${Math.round(ttlUse_o1s.reduce((sum, cur) => sum+cur, 0) / ttlUse_o1s.length)}ms, p${PT_LO}: ${percentile(ttlUse_o1s, PT_LO)}ms, p${PT_HI}: ${percentile(ttlUse_o1s, PT_HI)}ms, p_avg: ${Math.round(pAvg_ttlUse_o1.reduce((sum, cur) => sum+cur, 0) / pAvg_ttlUse_o1.length)}ms}`
        +      `, chainOrg3:{Min: ${Math.min.apply(Math, ttlUse_o3s)}ms, Max: ${Math.max.apply(Math, ttlUse_o3s)}ms, Avg: ${Math.round(ttlUse_o3s.reduce((sum, cur) => sum+cur, 0) / ttlUse_o3s.length)}ms, p${PT_LO}: ${percentile(ttlUse_o3s, PT_LO)}ms, p${PT_HI}: ${percentile(ttlUse_o3s, PT_HI)}ms, p_avg: ${Math.round(pAvg_ttlUse_o3.reduce((sum, cur) => sum+cur, 0) / pAvg_ttlUse_o3.length)}ms}`
        +  `}`
        + `}`
        );
      });
    }
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
  MaxRuns = RUNS * BATCH;

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

    // Check Server log line no before running test
    initSvrLogLineCnt[run] = {"rl1":0,"rl2":0};
    for (let k of Object.getOwnPropertyNames(ProcSetting.rlLogPath)) {
      const {stdout, stderr} = await exec(`cat ${ProcSetting.rlLogPath[k]} | wc -l`);

      if (stderr) {
        console.log(`ERROR on checking server log(${ProcSetting.rlLogPath[k]}), ${stderr}`)
        process.exit(-1);
      } else if (stdout) {
        initSvrLogLineCnt[run][k] = parseInt(stdout.toString());
      }    
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
        
        // Calculate and Print Stat.
        if (!isEnqOnly) {
          testRule.forEach(async e => {

            // Grep Svr Log
            await getTsRecFrSvr(e, values, run);

            // Re-calculation of rl, writeChain1, writeChain2, ttl
            const minWriteChainStart = Math.min.apply(Math, values.map( g => g.tsRec[e].writeChainStart));

            values.forEach (res => {
              // For "per request" record
              res.tsRec[e].rl = res.tsRec[e].proxyResFinish - res.tsRec[e].callEndPtStart;
              res.tsRec[e].redis = minWriteChainStart - res.tsRec[e].proxyResFinish;
              res.tsRec[e].chainOrg1 = res.tsRec[e].writeChainFinish - minWriteChainStart;
              res.tsRec[e].chainOrg3 = res.tsRec[e].callEndPtEnd - res.tsRec[e].writeChainFinish;
              res.tsRec[e].ttl = res.tsRec[e].callEndPtEnd - res.tsRec[e].callEndPtStart;

              // Print Breakdown
              if (isShowBkdn) {
                console.log(`[Test run ${run}][Breakdown]` + JSON.stringify(res));
              }
            });

            const rlRawData = values.map( o=> parseInt(o.tsRec[e].rl));
            const rdRawData = values.map( o=> parseInt(o.tsRec[e].redis));
            const o1RawData = values.map( o=> parseInt(o.tsRec[e].chainOrg1));
            const o3RawData = values.map( o=> parseInt(o.tsRec[e].chainOrg3));
            const tlRawData = values.map( o=> parseInt(o.tsRec[e].ttl));

            console.log(`[Test run ${run}][Perf Stat. of ${e}]`
            + `NoTrans: ${values.length}`
            + `, rl:{Min: ${Math.min.apply(Math, rlRawData)}ms, Max: ${Math.max.apply(Math, rlRawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt((cur.tsRec[e].rl)), 0) / values.length)}ms, p${PT_HI}: ${percentile(rlRawData.sort(numSortfunc), PT_HI)}ms}`
            + `, redis:{Min: ${Math.min.apply(Math, rdRawData)}ms, Max: ${Math.max.apply(Math, rdRawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].redis), 0) / values.length)}ms, p${PT_HI}: ${percentile(rdRawData.sort(numSortfunc), PT_HI)}ms}`
            + `, chainOrg1:{Min: ${Math.min.apply(Math, o1RawData)}ms, Max: ${Math.max.apply(Math, o1RawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].chainOrg1), 0) / values.length)}ms, p${PT_HI}: ${percentile(o1RawData.sort(numSortfunc), PT_HI)}ms}`
            + `, chainOrg3:{Min: ${Math.min.apply(Math, o3RawData)}ms, Max: ${Math.max.apply(Math, o3RawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].chainOrg3), 0) / values.length)}ms, p${PT_HI}: ${percentile(o3RawData.sort(numSortfunc), PT_HI)}ms}`
            + `, total:{Min: ${Math.min.apply(Math, tlRawData)}ms, Max: ${Math.max.apply(Math, tlRawData)}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+parseInt(cur.tsRec[e].ttl), 0) / values.length)}ms, p${PT_HI}: ${percentile(tlRawData.sort(numSortfunc), PT_HI)}ms}`
            );

            calSummaryStat(i , cfg, values);
          });
        } else {
          testRule.forEach(e => {
            console.log(`[Test run ${run}][Perf Stat. of ${process.env.FAB_TEST_RULE}]`
            + ` NoTrans: ${values.length}, Min: ${Math.min.apply(Math, values.map(function(o) { return (o.tsRec[e].callEndPtEnd-o.tsRec[e].callEndPtStart); }))}ms, Max: ${Math.max.apply(Math, values.map(function(o) { return (o.tsRec[e].callEndPtEnd-o.tsRec[e].callEndPtStart); }))}ms, Avg: ${Math.round(values.reduce((sum, cur) => sum+(parseInt(cur.tsRec[e].callEndPtEnd) - parseInt(cur.tsRec[e].callEndPtStart)), 0) / values.length)}ms`
            );
          });

          calSummaryStat(i , cfg, values);
        }

        // Promise.all will resolve only if all promises resolved
        if (authOn === 'less') {
          console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Completed: ${values.length} (A: ${Math.round(totalAuth/(i+1))}s)`);
        } else {
          console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Completed: ${values.length}`);
        }
      })
      .catch(errors => {
        console.log(`[Test run ${run}][Elapsed time ${((Date.now() - authStarts)/1000).toFixed(3)}s] Error: ${errors}`);
        totalRuns++;
        isAllRun();
        calSummaryStat(i , cfg);
      });

    if ((i+1) < RUNS) {
      await new Promise(resolve => setTimeout(resolve, runsWait * 1000));
    } 
  }
})();
