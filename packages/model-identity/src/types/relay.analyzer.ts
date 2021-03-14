import fs from 'fs';
import util from 'util';

const exec = util.promisify(require('child_process').exec);

const operations = {
  'createPo'            : '"url":"/order/po","method":"POST"',
  'editPo'              : '"url":"/order/po","method":"PUT"',
  'cancelPo'            : '"url":"/order/cancelPO","method":"POST"',
  'processPo'           : '"url":"/etccorp/pboc/api/v1/po/process","method":"POST"',
  'createInvoice'       : '"url":"/etccorp/pboc/api/v1/invoices","method":"POST"',
  'editInvoice'         : '"url":"/etccorp/pboc/api/v1/invoices","method":"PUT"',
  'transferInvoice'     : '"url":"/etccorp/pboc/api/v1/invoices/notify","method":"POST"',
  'confirmInvoice'      : '"url":"/invoice/result","method":"POST"',
  'updatePaymentStatus' : '"url":"/trade-financing/invresult","method":"POST"',
};

const grabId = async (path: string, ops: string, eid: string): Promise<string> => {
  const COMMAND = `cat ${path} | grep ROBUSTNESS | grep ${eid} | grep '${ops}' | grep '"id":"' | sed -En \'s/^.*"id"[:]"([0-9a-fA-F]+)".*$/\\1/gp\'`;
  return new Promise<string>(async (resolve, reject) => {
    try {
      const {stdout, stderr} = await exec(COMMAND);
      if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout.trim());
      }
    } catch (error) {
      reject(error);
    }
  });
};

interface Statistic {
  date: string;
  id?: string;
  url?: string;
  method?: string;
  status?: number;
  entities?: string[];
};

const grabRecords = async (path: string, ops: string, eid: string, rid: string): Promise<Statistic[]> => {
  const CMD1 = `cat ${path} | grep ROBUSTNESS | grep ${eid} | grep '${ops}'`;
  const CMD2 = `cat ${path} | grep ROBUSTNESS | grep ${rid}`;
  const COMMAND =
'LINES=$(' + CMD1 + ' && ' + CMD2 + '); ' +
'echo "[\\\"\\\""; ' +
'while read -r LINE; do ' +
'echo "$LINE" | sed -En \'s/^([[:digit:]]{4}[-][[:digit:]]{2}[-][[:digit:]]{2}T[[:digit:]]{2}[:][[:digit:]]{2}[:][[:digit:]]{2}[.][[:digit:]]+Z).*\\[ROBUSTNESS\\][{](.*)[}] \\(\\[.*$/,{"date":"\\1",\\2}/gp\'; ' +
'done <<< "$LINES"; ' + 
'echo "]"';

  return new Promise<Statistic[]>(async (resolve, reject) => {
    try {
      const {stdout, stderr} = await exec(COMMAND, {shell: '/bin/bash'});
      if (stderr) {
        reject(stderr);
      } else {
        const result = JSON.parse(stdout);
        resolve(
          result
            .filter((_, i) => i > 0)
            .filter((r, i, a) => (!r.writeFabFinish) || a.findIndex(e => e.writeFabFinish) === i) // Filter each element is the first occuring in the array
            .sort((a, b) => (a.date > b.date) ? 1 : (a.date < b.date) ? -1 : 0)
        );
      }
    } catch (error) {
      reject(error);
    }
  });
};

const grab = async (path: string, operation: string, entityId: string): Promise<Statistic[]> => {
  const oper = operations[operation];
  return new Promise<Statistic[]>(async (resolve, reject) => {
    if (!entityId) {
      resolve([]);
    } else {
      try {
        const rid = await grabId(path, oper, entityId);
        if (!rid) {
          resolve([]);
        } else {
          resolve(await grabRecords(path, oper, entityId, rid));
        }
      } catch (error) {
        reject(error);
      }
    }
  });
};

/*
 1 - writeNttStarts
 2 - proxyReqStarts
 3 - proxyReqFinish
 4 - proxyResStarts
 5 - proxyResFinish - before write to redis
 5 - writeNttFinish - after commands returns
 7 - redisResFinish - before process entity
 8 - writeFabFinish
 9 - readNttyFinish
 */
export const getAnalyzer = (pathInp: string, pathOut?: string) => {
  return async (operation: string, entityId: string) => {
    if (!operations[operation]) {
      console.log(`ERROR! unknow operation ${operation}`);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for log file to be ready

    // const d = new Date();
    // const dttm = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
    const dttm = new Date().toISOString();
    const data = {};
    const stats = await grab(pathInp, operation, entityId);
    for (const stat of stats) {
      const { date, id, url, method, entities, status, ...rest } = stat;
      Object.assign(data, rest);
    }
    if (stats.length > 0) {
      const result = {
        operation,
        entityId,
        start: data['proxyReqStarts'] - data['writeNttStarts'],
        relay: data['proxyResFinish'] - data['proxyReqStarts'],
        redis: data['redisResFinish'] - data['proxyResFinish'],
        fabrc: data['writeFabFinish'] - data['redisResFinish'],
        query: data['readNttyFinish'] - data['writeFabFinish'],
      };
      if (!pathOut) {
        // to console
        console.log(`${dttm} [start:${result.start.toString().padStart(4,'_')}][relay:${result.relay.toString().padStart(4,'_')}[redis:${result.redis.toString().padStart(7,'_')}][fabric:${result.fabrc.toString().padStart(7,'_')}][query:${result.query.toString().padStart(7,'_')}] ntt:${result.entityId} ops:${result.operation}`);
      } else {
        // fs.writeFile(pathOut, `${dttm.substring(0, 10)}T${dttm.substring(11, 19)} ${JSON.stringify(result)}\n`, { flag: 'a' }, err => {
        //   if (err) console.log('Error writing statistic data file', err);
        // });
        fs.writeFile(pathOut, `${dttm} [start:${result.start.toString().padStart(4,'_')}][relay:${result.relay.toString().padStart(4,'_')}[redis:${result.redis.toString().padStart(7,'_')}][fabric:${result.fabrc.toString().padStart(7,'_')}][query:${result.query.toString().padStart(7,'_')}] ntt:${result.entityId} ops:${result.operation}\n`, { flag: 'a' }, err => {
          if (err) console.log('Error writing statistic data file', err);
        });
      }
    }
  };
};

// Test
// (() => {
//   const analyzer = getAnalyzer('/Users/paul/proj/fabric-es/packages/tester/src/__tests__/uploads/app.log');

//   try {
//     // console.log('1', await grab(path, 'createPo', 'P123451602149708297012'));
//     // console.log('2', await grab(path, 'createPo', 'I123451602149708297052'));
//     // console.log('3', await grab(path, 'confirmInvoice', 'P123451602149708297012'));
//     // console.log('4', await grab(path, 'confirmInvoice', 'I123451602149708297052'));
//     analyzer('editPo', 'P123451602149708297032');
//   } catch (err) {
//     console.log('ERR', err);
//   }
// })();
