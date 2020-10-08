require('dotenv').config({ path: './.env' });
import https from 'https';
import fetch from 'node-fetch';
import { getTestData, QUERY } from '../relay/mockUtils';

export interface PerfTestConfig {
  EndPoints:string[];
  BATCH:number;
  RUNS:number;
  RUNS_WAIT:number;
  READ_RETRY:number;
  READ_WAIT:number;
  athreg:string;
  athlog:string;
  relay1:string;
  relay2:string;
  qryhdr:string;
  authOn:string
  range:number;
  stamp:number;
  agent:https.Agent;
  STATS_DATA?:string
}

export enum API {
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

export class PerfTest {
  
  static defaultCfg:PerfTestConfig =  <PerfTestConfig> {
    EndPoints : [
      '/user/inquiry',                              // 0 GET ?sellerId=
      '/order/po',                                  // 1 POST; PUT; multipart/form-data ???
      '/order/cancelPO',                            // 2 POST
      '/etccorp/pboc/api/v1/po/process',            // 3 POST
      '/etccorp/pboc/api/v1/invoices',              // 4 POST; PUT; multipart/form-data ???
      '/etccorp/pboc/api/v1/invoices/notify',       // 5 POST; multipart/form-data ???
      '/etccorp/pboc/api/v1/invoices/image/upload', // 6 POST ?invoiceId= &imageDesc=; multipart/form-data ???
      '/invoice/result',                            // 7 POST
      '/trade-financing/invresult'                  // 8 POST
    ] 
    ,BATCH:       parseInt(process.env.BATCH_NUM, 10) || 5 // Number of tests per run
    ,RUNS:        parseInt(process.env.RUNS_NUM, 10) || 3 // Total number of runs
    ,RUNS_WAIT:   parseInt(process.env.RUNS_WAIT, 10) || 30000 // Time to wait before sending the next batch of test (ms)
    ,READ_RETRY:  parseInt(process.env.READ_RETRY, 10) || 20 // Number of retries to read expected results from Fabric
    ,READ_WAIT:   parseInt(process.env.READ_WAIT, 10) || 500 // Time to wait between each read retry
    ,athreg:      `http://${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}/account`
    ,athlog:      `http://${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}/account/login`
    ,relay1:      `https://${process.env.RELAY_HOST1}:${process.env.RELAY_PORT1}` // ETC side
    ,relay2:      `https://${process.env.RELAY_HOST2}:${process.env.RELAY_PORT2}` // PBOC side
    ,qryhdr:      `http://${process.env.QUERY_HOST}:${process.env.QUERY_PORT}/graphql` // FDI node
    
    // 'yes'  - authenticate for every test
    // 'no'   - do not authenticate at all
    // 'less' - authenticate once per batch
    ,authOn:      process.env.AUTH_ON || 'yes'
    
    ,range:       Math.round(Math.log10(parseInt(process.env.RUNS_NUM, 10) * parseInt(process.env.BATCH_NUM, 10))) + 1
    ,stamp:       Date.now()
    ,agent:       new https.Agent({ rejectUnauthorized: false })
    ,STATS_DATA:  process.env.STATS_DATA
  }; 

  static authenticate = (username:string , email:string, password:string, pTestConfig?:PerfTestConfig ) : Promise<String> => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const uid = await fetch(`${config.athreg}`, {
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
          const token = await fetch(`${config.athlog}`, {
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

  static createPo = (data:any, pTestConfig?:PerfTestConfig) : Promise<String[]> => {
    return new Promise<string[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay2}${config.EndPoints[1]}`, {
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

  static editPo = (data:any, pTestConfig?:PerfTestConfig) : Promise<String[]> => {
    return new Promise<string[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay2}${config.EndPoints[1]}`, {
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

  static cancelPo = (data:any, pTestConfig?:PerfTestConfig) : Promise<string[]> => {
    return new Promise<string[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay2}${config.EndPoints[2]}`, {
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
  
  static processPo = (data:any, pTestConfig?:PerfTestConfig) : Promise<{poId:string; actionResponse:string}[]> => {
    return new Promise<{
      poId: string;
      actionResponse: string;
    }[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay1}${config.EndPoints[3]}`, {
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
  
  static createInvoice = (data:any, pTestConfig?:PerfTestConfig) : Promise<string[]> => {
    return new Promise<string[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay1}${config.EndPoints[4]}`, {
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
  
  static editInvoice = (data:any, pTestConfig?:PerfTestConfig) => {
    return new Promise<string[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay1}${config.EndPoints[4]}`, {
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
  
  static transferInvoice = (data:any, pTestConfig?:PerfTestConfig) : Promise<string[]> => {
    return new Promise<string[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay1}${config.EndPoints[5]}`, {
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
  
  static confirmInvoice = (data:any, pTestConfig?:PerfTestConfig) : Promise<{
    invoiceId: string;
    actionResponse: string;
  }[]> => {
    return new Promise<{
      invoiceId: string;
      actionResponse: string;
    }[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay2}${config.EndPoints[7]}`, {
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
  
  static updatePaymentStatus = (data:any, pTestConfig?:PerfTestConfig) : Promise<string[]> => {
    return new Promise<string[]>(async (resolve, reject) => {
      try {
        const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
        const agent = config.agent;
        await fetch(`${config.relay2}${config.EndPoints[8]}`, {
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

  static readEntities = (tag: string, accessToken: string, query: String, expected?: (results: any[]) => boolean, pTestConfig?:PerfTestConfig) : Promise<any>=> {
    return new Promise<any>(async (resolve, reject) => {
      const config = (!pTestConfig)?PerfTest.defaultCfg:pTestConfig;
      const agent = config.agent;
      let count = config.READ_RETRY;
  
      const headers = { 'content-type': 'application/json' };
      if (accessToken) headers['authorization'] = `bearer ${accessToken}`;

      while (count > 0) {
        try {
          const result = await fetch(config.qryhdr, {
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
          if (count < 0) console.log(`${tag} read entities ${query} retrying in ${config.READ_WAIT} ms (${count})`);
          await new Promise(resolve => setTimeout(resolve, config.READ_WAIT));
        } catch(error) {
          reject(error);
          return;
        }
      }
      reject(`WARNING!!! Read entities timeout: ${query}`);
    });
  };
}