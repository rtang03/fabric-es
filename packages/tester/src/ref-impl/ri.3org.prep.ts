require('dotenv').config({ path: './.env' });
import fetch from 'node-fetch';
import { authenticate, getLogger } from '../utils';
import { CREATE_WALLET } from './queries';
import {
  createLoan, createLoanDetails, updateLoan, updateLoanDetails, approveLoan,
  createDocument, createDocContents, updateDocument, updateDocContents, restrictDocAccess,
  createLoanDetailsOrg3,
} from './utils';

const gw1 = `http://${process.env.GATEWAY_HOST1}:${process.env.GATEWAY_PORT1}/graphql`;
const au1 = `${process.env.AUTH_HOST1}:${process.env.AUTH_PORT1}`;
const gw2 = `http://${process.env.GATEWAY_HOST2}:${process.env.GATEWAY_PORT2}/graphql`;
const au2 = `${process.env.AUTH_HOST2}:${process.env.AUTH_PORT2}`;
const gw3 = `http://${process.env.GATEWAY_HOST3}:${process.env.GATEWAY_PORT3}/graphql`;
const au3 = `${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}`;

const stamp = Date.now();

const logger = getLogger('[tester] test.prep.js');

const prep = (user1: string, token1: string, user2: string, token2: string, user3: string, token3: string) => {
  return new Promise<{ loanId: string; docId1: string; docId2: string }>(async (resolve, reject) => {
    const docIds: string[] = [];
    const testStarts = Date.now();

    let loanId;
    try {
      const rst1 = await createLoan(gw1, token1, user1, `loan${stamp}1`, `Loan ${stamp} 1`, `LOAN-REF-${stamp}-1`);
      if (rst1 && (rst1 !== undefined) && rst1.id) {
        console.log(`Created loan 1 ${rst1.id}`);
        loanId = rst1.id;
      } else {
        console.log(`Error creating loan 1`);
        reject();
        return;
      }
    } catch (error) {
      console.log(`Error creating loan 1 ${JSON.stringify(error)}`);
      reject(error);
      return;
    }

    try {
      const rst2 = await createLoanDetails(
        gw2, token2, user2, loanId,
        `reg${stamp}2`, `Requester ${stamp}`, `Contact ${stamp}`, `555-${stamp}`, `c${stamp}@fake.it`, `${stamp}`, 52, `HKD`, 42.9, `Loan details ${stamp} 2 for org1`
      );
      if (rst2 && (rst2 !== undefined) && rst2.id) {
        console.log(`Created loan details 2 ${rst2.id}`);
      } else {
        console.log(`Error creating loan details 2`);
        reject();
        return;
      }
    } catch (error) {
      console.log(`Error creating loan details 2 ${JSON.stringify(error)}`);
      reject(error);
      return;
    }

    let docId1;
    try {
      const rst1 = await createDocument(gw1, token1, user1, loanId, `doc${stamp}1a`, `Doc ${stamp} 1a`, `DOC-REF-${stamp}-1a`);
      if (rst1 && (rst1 !== undefined) && rst1.id) {
        const rst2 = await createDocContents(gw1, token1, user1, rst1.id, { body: `{ "message": "Doc Contents ${stamp} 1a" }` });
        if (rst2 && (rst2 !== undefined) && rst2.id) {
          docId1 = rst1.id;
        } else {
          console.log(`Error creating document content 1a`);
          reject();
          return;
        }
      } else {
        console.log(`Error creating document 1a`);
        reject();
        return;
      }
    } catch (error) {
      console.log(`Error creating document 1a ${JSON.stringify(error)}`);
      reject(error);
      return;
    }
    let docId2;
    try {
      const rst1 = await createDocument(gw1, token1, user1, loanId, `doc${stamp}1b`, `Doc ${stamp} 1b`, `DOC-REF-${stamp}-1b`);
      if (rst1 && (rst1 !== undefined) && rst1.id) {
        const rst2 = await createDocContents(gw1, token1, user1, rst1.id, { format: 'PDF', link: `http://fake.it/docs/docContents-${stamp}-1b.pdf` });
        if (rst2 && (rst2 !== undefined) && rst2.id) {
          docId2 = rst1.id;
        } else {
          console.log(`Error creating document content 1b`);
          reject();
          return;
        }
      } else {
        console.log(`Error creating document 1b`);
        reject();
        return;
      }
    } catch (error) {
      console.log(`Error creating document 1b ${JSON.stringify(error)}`);
      reject(error);
      return;
    }

    try {
      const rst3 = await createLoanDetailsOrg3(
        gw3, token3, user3, loanId,
        `reg${stamp}3`, `Requester ${stamp}`, `Contact ${stamp}`, `555-${stamp}`, `c${stamp}@fake.it`, `${stamp}`, 52, `HKD`, 42.9, `Loan details ${stamp} 3 for org1`,
        'Bun Gei'
      );
      if (rst3 && (rst3 !== undefined) && rst3.id) {
        console.log(`Created loan details 3 ${rst3.id}`);
      } else {
        console.log(`Error creating loan details 3`);
        reject();
        return;
      }
    } catch (error) {
      console.log(`Error creating loan details 3 ${JSON.stringify(error)}`);
      reject(error);
      return;
    }

    try {
      const rst3 = await createDocContents(gw3, token3, user3, docId1, { format: 'PDF', link: `http://fake.it/docs/docContents-${stamp}-3.pdf` });
      if (rst3 && (rst3 !== undefined) && rst3.id) {
        console.log(`Created loan details 3 ${rst3.id}`);
      } else {
        console.log(`Error creating document content 3`);
        reject();
        return;
      }
    } catch (error) {
      console.log(`Error creating document content 3 ${JSON.stringify(error)}`);
      reject(error);
      return;
    }

    resolve({
      loanId, docId1, docId2
    });
  });
};

// Start
void (async () => {
  console.log(`Running ref-impl test preparations...`);

  let token1;
  let token2;
  let token3;

  const user1 = `u${stamp}a`;
  try {
    token1 = await authenticate(au1, user1, `${user1}@fake.it`, 'p@ssw0rd');
  } catch (error) {
    console.log(`ERROR! ${error}`);
    return;
  }
  if (!token1 || (token1 === undefined)) {
    console.log(`ERROR! Get access token failed for user ${user1}`);
    return;
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

  const user2 = `u${stamp}b`;
  try {
    token2 = await authenticate(au2, user2, `${user2}@fake.it`, 'p@ssw0rd');
  } catch (error) {
    console.log(`ERROR! ${error}`);
    return;
  }
  if (!token2 || (token2 === undefined)) {
    console.log(`ERROR! Get access token failed for user ${user2}`);
    return;
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

  const user3 = `u${stamp}c`;
  try {
    token3 = await authenticate(au3, user3, `${user3}@fake.it`, 'p@ssw0rd');
  } catch (error) {
    console.log(`ERROR! ${error}`);
    return;
  }
  if (!token3 || (token3 === undefined)) {
    console.log(`ERROR! Get access token failed for user ${user3}`);
    return;
  }
  const ready3 = await fetch(gw3, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${token3}` }, body: JSON.stringify({
      operationName: 'CreateWallet', query: CREATE_WALLET
    })})
    .then(res => res.json())
    .then(({ data }) => data);
  if (!ready3) {
    console.log(`♨️♨️  Create wallet for user ${user3} in gateway ${gw3} failed`);
    return;
  }

  const result = await prep(user1, token1, user2, token2, user3, token3);
  console.log(JSON.stringify(result, null, ' '));
})();