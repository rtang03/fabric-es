require('dotenv').config({ path: './.env' });
import fetch from 'node-fetch';
import { authenticate, getLogger } from '../utils';
import {
  APPLY_LOAN,
  APPROVE_LOAN,
  CREATE_DOC_CONTENTS,
  CREATE_DOCUMENT,
  CREATE_LOAN_DETAILS,
  CREATE_WALLET,
  GET_COMMITS_BY_DOCUMENT,
  GET_COMMITS_BY_LOAN,
  GET_DOCUMENT_BY_ID,
  GET_LOAN_BY_ID_ORG1,
  GET_LOAN_BY_ID_ORG2,
  RESTRICT_DOC_ACCESS,
  SEARCH_DOCUMENT_BY_FIELDS,
  SEARCH_DOCUMENT_CONTAINS,
  SEARCH_LOAN_BY_FIELDS,
  SEARCH_LOAN_CONTAINS,
  UPDATE_DOC_CONTENTS,
  UPDATE_DOCUMENT,
  UPDATE_LOAN,
  UPDATE_LOAN_DETAILS
} from './queries';

const RUNS = parseInt(process.env.RUNS_NUM, 10) || 3; // Total number of runs
const BATCH = parseInt(process.env.BATCH_NUM, 10) || 5; // Number of tests per run
const RUNS_WAIT = parseInt(process.env.RUNS_WAIT, 10) || 30000; // Time to wait before sending the next batch of test (ms)
const READ_RETRY = parseInt(process.env.READ_RETRY, 10) || 20; // Number of retries to read expected results from Fabric
const READ_WAIT = parseInt(process.env.READ_WAIT, 10) || 3000; // Time to wait between each read retry

const gw1 = `http://${process.env.GATE_HOST1}:${process.env.GATE_PORT1}/graphql`;
const au1 = `${process.env.AUTH_HOST1}:${process.env.AUTH_PORT1}`;
const gw2 = `http://${process.env.GATE_HOST2}:${process.env.GATE_PORT2}/graphql`;
const au2 = `${process.env.AUTH_HOST2}:${process.env.AUTH_PORT2}`;
// const gw3 = `http://${process.env.GATE_HOST3}:${process.env.GATE_PORT3}/graphql`;
// const au3 = `${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}`;

const range = Math.round(Math.log10(RUNS * BATCH)) + 1;
const stamp = Date.now();

const logger = getLogger('[tester] ri.rtest.js');

const createLoan = (url: string, token: string, userId: string, loanId: string, description: string, reference: string) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: { userId, loanId, description, reference }})})
        .then(res => res.json())
        // .then(res => {
        //   console.log(res);
        //   return res;
        // })
        .then(res => {
          if (res.data && res.data.applyLoan && (res.data.applyLoan.id === loanId))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const updateLoan = (
  url: string, token: string, userId: string, loanId: string,
  payload: { description?: string; comment?: string }
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'UpdateLoan', query: UPDATE_LOAN,
          variables: { userId, loanId, ...payload }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.updateLoan && (res.data.updateLoan.map(l => l.id).includes(loanId)))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const createLoanDetails = (
  url: string, token: string, userId: string, loanId: string,
  registration: string, requesterName: string,
  contactName: string, phone: string, email: string,
  startDate: string, tenor: number, currency: string, amount: number, comment: string
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId, loanId, requester: { registration, name: requesterName },
            contact: { name: contactName, phone, email },
            startDate, tenor, currency, requestedAmt: amount, comment
          }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.createLoanDetails && (res.data.createLoanDetails.id === loanId))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const updateLoanDetails = (
  url: string, token: string, userId: string, loanId: string,
  payload: {
    contact?: { name?: string; phone?: string; email?: string };
    comment?: string;
  }
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'UpdateLoanDetails',
          query: UPDATE_LOAN_DETAILS,
          variables: { userId, loanId, ...payload }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.updateLoanDetails && (res.data.updateLoanDetails.map(d => d.id).includes(loanId)))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const createDocument = (url: string, token: string, userId: string, loanId: string, documentId: string, title: string, reference: string) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'CreateDocument', query: CREATE_DOCUMENT,
          variables: { userId, documentId, loanId, title, reference }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.createDocument && (res.data.createDocument.id === documentId))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const updateDocument = (
  url: string, token: string, userId: string, documentId: string,
  payload: { loanId?: string; title?: string }
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'UpdateDocument', query: UPDATE_DOCUMENT,
          variables: { userId, documentId, ...payload }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.updateDocument && (res.data.updateDocument.map(d => d.id).includes(documentId)))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const createDocContents = (
  url: string, token: string, userId: string, documentId: string,
  content: { body: string } | { format: string; link: string },
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'CreateDocContents', query: CREATE_DOC_CONTENTS,
          variables: { userId, documentId, content }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.createDocContents && (res.data.createDocContents.id === documentId))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const updateDocContents = (
  url: string, token: string, userId: string, documentId: string,
  content: { body: string } | { format: string; link: string },
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'UpdateDocContents', query: UPDATE_DOC_CONTENTS,
          variables: { userId, documentId, content }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.updateDocContents && (res.data.updateDocContents.id === documentId))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};


const restrictDocAccess = (url: string, token: string, userId: string, documentId: string) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'RestrictAccess', query: RESTRICT_DOC_ACCESS,
          variables: { userId, documentId }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.restrictAccess && (res.data.restrictAccess.id === documentId))
            resolve({ id: documentId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const approveLoan = (url: string, token: string, userId: string, loanId: string) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    const start = Date.now();
    try {
      await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
          operationName: 'ApproveLoan', query: APPROVE_LOAN,
          variables: { userId, loanId }})})
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.approveLoan && (res.data.approveLoan.id === loanId))
            resolve({ id: loanId, elapsed: Date.now() - start });
          else
            reject(res);
        }).catch(errors => {
          reject(errors);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const readLoan = (
  url: string, token: string, query: string, loanId: string,
  run: string, test: string, validate: (result: any, test: string) => boolean
) => {
  return new Promise<{ id: string; elapsed: number }>(async (resolve, reject) => {
    let count = READ_RETRY;
    const start = Date.now();
    while (count > 0) {
      try {
        const result = await fetch(url, {
          method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token}` }, body: JSON.stringify({
            operationName: 'GetLoanById', query, variables: { loanId }
          })}).then(res => res.json());

        if (result !== undefined) {
          // console.log(`Read result! ${JSON.stringify(result)}`);
          if (result.errors) {
            reject(JSON.stringify(result.errors));
            return;
          } else if (result.data && result.data.getLoanById && result.data.getLoanById.reference && validate(result.data.getLoanById, test)) {
            resolve({ id: loanId, elapsed: Date.now() - start });
            return;
          }
        }

        count --;
        if (count < 0) console.log(`[Test run ${run}][#${test}] read loan ${loanId} retrying in ${READ_WAIT} ms (${count})`); // TODO TEMP
        await new Promise(resolve => setTimeout(resolve, READ_WAIT));
      } catch (error) {
        reject(error);
      }
    }
    reject(`WARNING!!! Read loan ${loanId} timeout`);
  });
};

const validate = (result: any, test: string): boolean => {
  if (result.reference && (result.reference !== `ref${test}`)) {
    return false;
  }
  if (result.comment && (result.comment !== `Comment ${test}`)) {
    return false;
  }
  if (result.status !== 2) {
    // console.log(`ONEc ${JSON.stringify(result)}`);
    return false;
  }

  const docRef = {};
  if (result.documents) {
    for (const r of result.documents) {
      if (r && r.reference) docRef[r.reference] = r.status;
      if (r && r.title) docRef[r.title] = true;
      if (r && r.contents) {
        for (const s of r.contents) {
          if (s && s.content && s.content.body) docRef[s.content.body] = true;
          if (s && s.content && s.content.link) docRef[s.content.link] = true;
        }
      }
    }
  }
  if ((docRef[`ref1${test}`] !== 0) || (docRef[`ref2${test}`] !== 2)) {
    return false;
  }
  if (docRef[`Title 2 ${test}`] === undefined) {
    console.log(`TWOa ${JSON.stringify(docRef)}`);
    return false;
  }
  if (docRef[`{ "body": "Doc Contents 1 ${test}" }`] === undefined) return false;
  if (docRef[`http://fake.it/docs/docContents-2${test}.pdf`] === undefined) return false;

  const dtlReg = {};
  if (result._details) {
    for (const r of result._details) {
      if (r && r.requester && r.requester.registration) dtlReg[r.requester.registration] = true;
      if (r && r.contact && r.contact.name) dtlReg[r.contact.name] = true;
    }
  }
  if (dtlReg[`reg${test}`] === undefined) {
    return false;
  }
  if (dtlReg[`Contact ${test}`] === undefined) {
    console.log(`THREEa ${JSON.stringify(dtlReg)}`);
    return false;
  }

  return true;
};

const runTest = (idx: number, run: string, test: string, user1: string, token1: string, user2: string, token2: string) => {
  return new Promise<{ results: string[]; elapsed: number }>(async (resolve, reject) => {
    let loanId;
    const docIds: string[] = [];
    const testStarts = Date.now();
    console.log(`[Test run ${run}][#${test}] Starting... ${idx}`);

    // ORG2 create loans
    let elapsed1;
    try {
      const rst1 = await createLoan(gw2, token2, user2, `loan${test}`, `Description ${run}${idx}`, `ref${test}`);
      if (rst1 && (rst1 !== undefined) && rst1.id) {
        const rst2 = await createLoanDetails(
          gw2, token2, user2, rst1.id,
          `reg${test}`, `Requester ${run}${idx}`, `Contact ${run}${idx}`, `555-00${run}${idx}`, `c${run}${idx}@fake.it`,
          `16098395857${run}${idx}`, 52, `HKD`, 42.9, `Comment ${run}${idx}`
        );
        if (rst2 && (rst2 !== undefined) && rst2.id) {
          loanId = rst1.id;
          elapsed1 = rst1.elapsed + rst2.elapsed;
        } else {
          console.log(`[Test run ${run}][#${test}] Error creating loan details 1`);
          reject(idx);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${test}] Error creating loan 1`);
        reject(idx);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error creating loan 1 ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }

    // ORG1 submit documents
    let elapsed2 = 0;
    try {
      const rst1 = await createDocument(gw1, token1, user1, loanId, `doc${test}1`, `Title 1 ${run}${idx}`, `ref1${test}`);
      if (rst1 && (rst1 !== undefined) && rst1.id) {
        const rst2 = await createDocContents(gw1, token1, user1, rst1.id, { body: `{ "message": "Doc Contents 1 ${test}" }` });
        if (rst2 && (rst2 !== undefined) && rst2.id) {
          docIds.push(rst1.id);
          elapsed2 += rst1.elapsed + rst2.elapsed;
        } else {
          console.log(`[Test run ${run}][#${test}] Error creating document content 1`);
          reject(idx);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${test}] Error creating dcoument 1`);
        reject(idx);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error creating document 1 ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }
    try {
      const rst1 = await createDocument(gw1, token1, user1, loanId, `doc${test}2`, `Title 2 ${run}${idx}`, `ref2${test}`);
      if (rst1 && (rst1 !== undefined) && rst1.id) {
        const rst2 = await createDocContents(gw1, token1, user1, rst1.id, { format: 'PDF', link: `http://fake.it/docs/docContents-2${test}.pdf` });
        if (rst2 && (rst2 !== undefined) && rst2.id) {
          docIds.push(rst1.id);
          elapsed2 += rst1.elapsed + rst2.elapsed;
        } else {
          console.log(`[Test run ${run}][#${test}] Error creating document content 2`);
          reject(idx);
          return;
        }
      } else {
        console.log(`[Test run ${run}][#${test}] Error creating dcoument 2`);
        reject(idx);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error creating document 2 ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }

    // ORG1 update loan
    let elapsed3;
    try {
      const rst = await updateLoan(gw1, token1, user1, loanId, { comment: `Comment ${test}` });
      if (!rst || (rst === undefined) || !rst.id) {
        console.log(`[Test run ${run}][#${test}] Error updating loan 1`);
        reject(idx);
        return;
      }
      elapsed3 = rst.elapsed;
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error updating loan 1 ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }

    // ORG2 update document
    let elapsed4;
    try {
      const rst = await updateDocument(gw2, token2, user2, docIds[1], { title: `Title 2 ${test}` });
      if (!rst || (rst === undefined) || !rst.id) {
        console.log(`[Test run ${run}][#${test}] Error updating document 2`);
        reject(idx);
        return;
      }
      elapsed4 = rst.elapsed;
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error updating document 2 ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }

    // ORG2 update loan details
    let elapsed5;
    try {
      const rst = await updateLoanDetails(gw2, token2, user2, loanId, { contact: { name: `Contact ${test}` }});
      if (!rst || (rst === undefined) || !rst.id) {
        console.log(`[Test run ${run}][#${test}] Error updating loan details`);
        reject(idx);
        return;
      }
      elapsed5 = rst.elapsed;
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error updating loan details ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }

    // ORG1 update doc content
    let elapsed6;
    try {
      const rst = await updateDocContents(gw1, token1, user1, docIds[0], { body: `{ "body": "Doc Contents 1 ${test}" }` });
      if (!rst || (rst === undefined) || !rst.id) {
        console.log(`[Test run ${run}][#${test}] Error updating doc contents`);
        reject(idx);
        return;
      }
      elapsed6 = rst.elapsed;
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error updating doc contents ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }

    // Org1 restrict document access
    let elapsed7;
    try {
      const rst = await restrictDocAccess(gw1, token1, user1, docIds[1]);
      if (!rst || (rst === undefined) || !rst.id) {
        console.log(`[Test run ${run}][#${test}] Error updating document status`);
        reject(idx);
        return;
      }
      elapsed7 = rst.elapsed;
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error updating document status ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }

    // Org2 approve loan
    let elapsed8;
    try {
      const rst = await approveLoan(gw2, token2, user2, loanId);
      if (!rst || (rst === undefined) || !rst.id) {
        console.log(`[Test run ${run}][#${test}] Error updating loan status`);
        reject(idx);
        return;
      }
      elapsed8 = rst.elapsed;
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error updating loan status ${JSON.stringify(error)}`);
      reject(idx);
      return;
    }

    // Org1 read results
    let elapsed9;
    try {
      const rst = await readLoan(gw1, token1, GET_LOAN_BY_ID_ORG1, loanId, run, test, validate);
      if (rst && (rst !== undefined) && rst.id) {
        if (rst.id !== loanId) {
          console.log(`[Test run ${run}][#${test}] Error: expected to read ${loanId}, got ${rst.id}`);
          reject(idx);
        }
        elapsed9 = rst.elapsed;
      } else {
        console.log(`[Test run ${run}][#${test}] Error reading loan`);
        reject(idx);
        return;
      }
    } catch (error) {
      console.log(`[Test run ${run}][#${test}] Error reading loans ${error}`);
      reject(idx);
      return;
    }

    const testFinish = Date.now();
    const elapsed = (testFinish - testStarts) / 1000;
    console.log(`[Test run ${run}][#${test}] Finished, total elapsed time: ${elapsed}s | read elapsed time: ${elapsed9/1000}s`);
    resolve({ results: [loanId, ...docIds], elapsed });
  });
};

// Start
(async () => {
  console.log(`Running ${RUNS} x ${BATCH} ref-impl tests (${RUNS_WAIT}s, ${READ_WAIT}ms x ${READ_RETRY})...`);

  let idx = 0;
  let token1;
  let token2;
  let runsWait = RUNS_WAIT;
  let lastElapsedTimes = [ RUNS_WAIT ];

  for (let i = 0; i < RUNS; i ++) {
    const tests = [];
    for (let j = 0; j < BATCH; j ++) {
      tests.push(`${stamp}${('' + idx).padStart(range, '0')}`);
      idx ++;
    }

    const run = (''+(i+1)).padStart(range, '0');

    const runStarts = Date.now();
    const user1 = `u${stamp}${run}a`;
    try {
      token1 = await authenticate(au1, user1, `${stamp}${run}a@fake.it`, 'p@ssw0rd');
    } catch (error) {
      console.log(`ERROR! ${error}`);
      continue;
    }
    if (!token1 || (token1 === undefined)) {
      console.log(`ERROR! Get access token failed for user u${stamp}${run}a`);
      continue;
    }
    const ready1 = await fetch(gw1, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token1}` }, body: JSON.stringify({
        operationName: 'CreateWallet', query: CREATE_WALLET
      })})
      .then(res => res.json())
      .then(({ data }) => data);
    if (!ready1) {
      console.log(`♨️♨️  Create wallet for user ${user1} in gateway ${gw1} failed`);
      return;
    }

    const user2 = `u${stamp}${run}b`;
    try {
      token2 = await authenticate(au2, user2, `${stamp}${run}b@fake.it`, 'p@ssw0rd');
    } catch (error) {
      console.log(`ERROR! ${error}`);
      continue;
    }
    if (!token2 || (token2 === undefined)) {
      console.log(`ERROR! Get access token failed for user u${stamp}${run}b`);
      continue;
    }
    const ready2 = await fetch(gw2, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token2}` }, body: JSON.stringify({
        operationName: 'CreateWallet', query: CREATE_WALLET
      })})
      .then(res => res.json())
      .then(({ data }) => data);
    if (!ready2) {
      console.log(`♨️♨️  Create wallet for user ${user2} in gateway ${gw2} failed`);
      return;
    }

    console.log(`[Test run ${run}][Ran for ${((Date.now() - stamp)/1000).toFixed(3)}s], next batch in ${runsWait}s, access token: ${token1.substr(37, 50)} | ${token2.substr(37, 50)}`);
    Promise.all(tests.map(async (v, j) => runTest(j, run, v, user1, token1, user2, token2)))
    .then(values => {
      lastElapsedTimes = lastElapsedTimes.concat(values.map(v => v.elapsed));
      const num = lastElapsedTimes.length - 100;
      if (num > 0) {
        for (let j = 0; j < num; j ++) {
          lastElapsedTimes.shift();
        }
      }
      runsWait = Math.ceil(lastElapsedTimes.reduce((a, c) => a + c, 0) / lastElapsedTimes.length);
      console.log(`[Test run ${run}][Elapsed time ${((Date.now() - runStarts)/1000).toFixed(3)}s] Completed # of tests: ${values.reduce((a, v) => a + v.results.length, 0)}`);
    })
    .catch(errors => {
      console.log(`[Test run ${run}][Elapsed time ${((Date.now() - runStarts)/1000).toFixed(3)}s] Error: ${errors}`);
    });

    await new Promise(resolve => setTimeout(resolve, runsWait * 1000));
  }

})();