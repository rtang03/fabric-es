require('dotenv').config({ path: './.env' });
import fetch from 'node-fetch';
import {
  CREATE_DOC_CONTENTS,
  CREATE_DOCUMENT,
  CREATE_DOCUMENT_CUST,
  CREATE_LOAN_DETAILS,
  GET_COMMITS_BY_DOCUMENT,
  GET_COMMITS_BY_LOAN,
  GET_DOCUMENT_BY_ID,
  GET_LOAN_BY_ID_ORG1,
  GET_LOAN_BY_ID_ORG2,
  GET_LOAN_BY_ID_ORG3,
  GW_REGISTER_ENROLL,
  OAUTH_LOGIN,
  OAUTH_REGISTER,
  APPLY_LOAN,
  UPDATE_LOAN,
  UPDATE_LOAN_DETAILS,
  UPDATE_DOCUMENT,
  UPDATE_DOCUMENT_CUST
} from './queries';

const AUTH_SERVER1 = `http://${process.env.AUTH_HOST1}:${process.env.AUTH_PORT1}/graphql`;
const AUTH_SERVER2 = `http://${process.env.AUTH_HOST2}:${process.env.AUTH_PORT2}/graphql`;
const AUTH_SERVER3 = `http://${process.env.AUTH_HOST3}:${process.env.AUTH_PORT3}/graphql`;
const GATEWAY1 = `http://${process.env.GATEWAY_HOST1}:${process.env.GATEWAY_PORT1}/graphql`;
const GATEWAY2 = `http://${process.env.GATEWAY_HOST2}:${process.env.GATEWAY_PORT2}/graphql`;
const GATEWAY3 = `http://${process.env.GATEWAY_HOST3}:${process.env.GATEWAY_PORT3}/graphql`;

const password = 'p@ssw0rd';
const timestamp = Date.now();

const userId1 = 'USER_ORG1';
const admin1 =  `a1${timestamp}@org.example.com`;
const user1 =   `u1${timestamp}@org.example.com`;
const loanId1 = `l1${timestamp}`;
const docId1a = `d1${timestamp}`;
const docId1b = `d1${timestamp + 10}`;

const userId2 = 'USER_ORG2';
const admin2 =  `a2${timestamp}@org.example.com`;
const user2 =   `u2${timestamp}@org.example.com`;
const loanId2 = `l2${timestamp}`;
const docId2a = `d2${timestamp}`;
const docId2b = `d2${timestamp + 10}`;

const userId3 = 'USER_ORG3';
const admin3 =  `a3${timestamp}@org.example.com`;
const user3 =   `u3${timestamp}@org.example.com`;
const loanId3 = `l3${timestamp}`;
const docId3a = `d3${timestamp}`;
const docId3b = `d3${timestamp + 10}`;

let isReady = false;
let accessToken1;
let accessToken2;
let accessToken3;

beforeAll(async () => {
  try {
    console.log(`♨️♨️  Prepare Org1`);
    // Register Org1 admin
    if (!await fetch(AUTH_SERVER1, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Register', query: OAUTH_REGISTER,
        variables: { email: admin1, username: admin1, password, admin_password: process.env.ROOT_ADMIN_PASSWORD1 }
      })})
    .then(res => res.json())
    .then(({ data }) => data)) {
      console.log(`♨️♨️  Registering administrator to OAUTH server ${AUTH_SERVER1} failed`);
      return;
    }
    // Login Org1 admin
    const { log1a, tok1a } = await fetch(AUTH_SERVER1, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Login', query: OAUTH_LOGIN,
        variables: { email: admin1, password }
      })})
    .then(res => res.json())
    .then(({ data }) => {
      if (data.login.ok) return { log1a: true, tok1a: data.login.accessToken };
    });
    if (!log1a) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER1} as ${admin1} / ${password} failed`);
      return;
    }
    // Register Org1 user
    if (!await fetch(AUTH_SERVER1, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Register', query: OAUTH_REGISTER,
        variables: { email: user1, username: user1, password }
      })})
    .then(res => res.json())
    .then(({ data }) => data)) {
      console.log(`♨️♨️  Registering to OAUTH server ${AUTH_SERVER1} failed`);
      return;
    }
    // Login Org1 user
    const { log1, rol1, tok1 } = await fetch(AUTH_SERVER1, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Login', query: OAUTH_LOGIN,
        variables: { email: user1, password }
      })})
    .then(res => res.json())
    .then(({ data }) => {
      if (data.login.ok) return { log1: true, rol1: data.login.user.id, tok1: data.login.accessToken };
    });
    if (!log1) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER1} as ${user1} / ${password} failed`);
      return;
    }
    // Enroll Org1 user
    const org1Ready = await fetch(GATEWAY1, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${tok1a}` }, body: JSON.stringify({
        operationName: 'RegisterAndEnrollUser', query: GW_REGISTER_ENROLL,
        variables: { enrollmentId: rol1, enrollmentSecret: 'password', administrator: process.env.CA_ENROLLMENT_ID_ADMIN1 }
      })})
    .then(res => res.json())
    .then(({ data }) => data);
    if (!org1Ready) {
      console.log(`♨️♨️  Enrolling user ${rol1} to gateway ${GATEWAY1} failed`);
      return;
    }
    accessToken1 = tok1;

    console.log(`♨️♨️  Prepare Org2`);
    // Register Org2 admin
    if (!await fetch(AUTH_SERVER2, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Register', query: OAUTH_REGISTER,
        variables: { email: admin2, username: admin2, password, admin_password: process.env.ROOT_ADMIN_PASSWORD2 }
      })})
    .then(res => res.json())
    .then(({ data }) => data)) {
      console.log(`♨️♨️  Registering administrator to OAUTH server ${AUTH_SERVER2} failed`);
      return;
    }
    // Login Org2 admin
    const { log2a, tok2a } = await fetch(AUTH_SERVER2, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Login', query: OAUTH_LOGIN,
        variables: { email: admin2, password }
      })})
    .then(res => res.json())
    .then(({ data }) => {
      if (data.login.ok) return { log2a: true, tok2a: data.login.accessToken };
    });
    if (!log2a) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER2} as ${admin2} / ${password} failed`);
      return;
    }
    // Register Org2 user
    if (!await fetch(AUTH_SERVER2, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Register', query: OAUTH_REGISTER,
        variables: { email: user2, username: user2, password }
      })})
    .then(res => res.json())
    .then(({ data }) => data)) {
      console.log(`♨️♨️  Registering to OAUTH server ${AUTH_SERVER2} failed`);
      return;
    }
    // Login Org2 user
    const { log2, rol2, tok2 } = await fetch(AUTH_SERVER2, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Login', query: OAUTH_LOGIN,
        variables: { email: user2, password }
      })})
    .then(res => res.json())
    .then(({ data }) => {
      if (data.login.ok) return { log2: true, rol2: data.login.user.id, tok2: data.login.accessToken };
    });
    if (!log2) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER2} as ${user2} / ${password} failed`);
      return;
    }
    // Enroll Org2 user
    const org2Ready = await fetch(GATEWAY2, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${tok2a}` }, body: JSON.stringify({
        operationName: 'RegisterAndEnrollUser', query: GW_REGISTER_ENROLL,
        variables: { enrollmentId: rol2, enrollmentSecret: 'password', administrator: process.env.CA_ENROLLMENT_ID_ADMIN2 }
      })})
    .then(res => res.json())
    .then(({ data }) => data);
    if (!org2Ready) {
      console.log(`♨️♨️  Enrolling user ${rol2} to gateway ${GATEWAY2} failed`);
      return;
    }
    accessToken2 = tok2;

    console.log(`♨️♨️  Prepare Org3`);
    // Register Org3 admin
    if (!await fetch(AUTH_SERVER3, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Register', query: OAUTH_REGISTER,
        variables: { email: admin3, username: admin3, password, admin_password: process.env.ROOT_ADMIN_PASSWORD3 }
      })})
    .then(res => res.json())
    .then(({ data }) => data)) {
      console.log(`♨️♨️  Registering administrator to OAUTH server ${AUTH_SERVER3} failed`);
      return;
    }
    // Login Org3 admin
    const { log3a, tok3a } = await fetch(AUTH_SERVER3, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Login', query: OAUTH_LOGIN,
        variables: { email: admin3, password }
      })})
    .then(res => res.json())
    .then(({ data }) => {
      if (data.login.ok) return { log3a: true, tok3a: data.login.accessToken };
    });
    if (!log3a) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER3} as ${admin3} / ${password} failed`);
      return;
    }
    // Register Org3 user
    if (!await fetch(AUTH_SERVER3, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Register', query: OAUTH_REGISTER,
        variables: { email: user3, username: user3, password }
      })})
    .then(res => res.json())
    .then(({ data }) => data)) {
      console.log(`♨️♨️  Registering to OAUTH server ${AUTH_SERVER3} failed`);
      return;
    }
    // Login Org3 user
    const { log3, rol3, tok3 } = await fetch(AUTH_SERVER3, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        operationName: 'Login', query: OAUTH_LOGIN,
        variables: { email: user3, password }
      })})
    .then(res => res.json())
    .then(({ data }) => {
      if (data.login.ok) return { log3: true, rol3: data.login.user.id, tok3: data.login.accessToken };
    });
    if (!log3) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER3} as ${user3} / ${password} failed`);
      return;
    }
    // Enroll Org3 user
    const org3Ready = await fetch(GATEWAY3, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${tok3a}` }, body: JSON.stringify({
        operationName: 'RegisterAndEnrollUser', query: GW_REGISTER_ENROLL,
        variables: { enrollmentId: rol3, enrollmentSecret: 'password', administrator: process.env.CA_ENROLLMENT_ID_ADMIN3 }
      })})
    .then(res => res.json())
    .then(({ data }) => data);
    if (!org3Ready) {
      console.log(`♨️♨️  Enrolling user ${rol3} to gateway ${GATEWAY3} failed`);
      return;
    }
    accessToken3 = tok3;

    isReady = org1Ready && org2Ready && org3Ready;
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

afterAll(async () => {
  console.log('Multi-Orgs test finished', timestamp);
});

describe('Multi-Org Test - Initialize Org1', () => {
  it('apply loan 1', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: {
            userId: userId1, loanId: loanId1,
            description: 'Org1 Loan 1',
            reference: 'REF-ORG1-LOAN-1'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.applyLoan.id).toEqual(loanId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('submit document 1a', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT,
          variables: {
            userId: userId1, documentId: docId1a, loanId: loanId1,
            title: 'Org1 Document 1',
            reference: 'REF-ORG1-DOC-1'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocument.id).toEqual(docId1a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('submit document 1b', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT,
          variables: {
            userId: userId1, documentId: docId1b, loanId: loanId1,
            title: 'Org1 Document 2',
            reference: 'REF-ORG1-DOC-2'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocument.id).toEqual(docId1b))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add docContents to document 1a', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS,
          variables: {
            userId: userId1, documentId: docId1a,
            content: { body: `{ "message": "Org1 docContents 1" }` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId1a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add docContents to document 1b', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS,
          variables: {
            userId: userId1, documentId: docId1b,
            content: { format: 'PDF', link: `http://fake.it/docs/org1DocContents-2.pdf` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId1b))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('overwrite loan 1, should fail after adding entity lifecycle event attribute!', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: {
            userId: userId1, loanId: loanId1,
            description: 'Org1 Loan 1 OVERWRITTEN',
            reference: 'REF-ORG1-LOAN-1-OVERWRITTEN',
            comment: 'Hello 0001 OVERWRITTEN'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.applyLoan.id).toEqual(loanId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('apply loan with missing required field', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: {
            userId: userId1, loanId: 'L9999',
            description: '',
            reference: 'REF-ORG1-LOAN-1'
          }})})
        .then(res => res.json())
        .then(({ errors }) => expect(errors.reduce((acc, cur) =>
          cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update loan 1', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'UpdateLoan', query: UPDATE_LOAN,
          variables: {
            userId: userId1, loanId: loanId1,
            description: '',
            reference: 'REF-ORG1-LOAN-1-EDITED',
            comment: 'Hello 0001 ADDED'
          }})})
        .then(res => res.json())
        .then(({ data, errors }) => {
          const errs = errors.map(e => e.message);
          expect(errs).toContain('Error: INVALID_OPERATION');
          expect(errs).toContain('Error: REQUIRED_DATA_MISSING');
          expect(data.updateLoan.map(d => (d && d.id) ? d.id : '')).toContain(loanId1);
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update a non-existing loan', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'UpdateLoan', query: UPDATE_LOAN,
          variables: {
            userId: userId1, loanId: 'L9999',
            description: 'Org1 Loan 9999',
            comment: 'Hello 9999'
          }})})
        .then(res => res.json())
        .then(({ errors }) => expect(errors.reduce((acc, cur) =>
          cur.message.includes('LOAN_NOT_FOUND') ? cur.message : acc, '')).toContain('LOAN_NOT_FOUND'))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Multi-Org Test - Initialize Org2', () => {
  it('apply loan 2', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: {
            userId: userId2, loanId: loanId2,
            description: 'Org2 Loan 2',
            reference: 'REF-ORG2-LOAN-2',
            comment: 'Hello 0002'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.applyLoan.id).toEqual(loanId2))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('submit document 2a', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT,
          variables: {
            userId: userId2, documentId: docId2a, loanId: loanId2,
            title: 'Org2 Document 1',
            reference: 'REF-ORG2-DOC-1'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocument.id).toEqual(docId2a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('submit document 2b', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT,
          variables: {
            userId: userId2, documentId: docId2b, loanId: loanId2,
            title: 'Org2 Document 2',
            reference: 'REF-ORG2-DOC-2'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocument.id).toEqual(docId2b))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add loanDetails to loan 2', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId: userId2, loanId: loanId2,
            requester: { registration: 'BR1234567XXX2', name: 'Loan Requester 2' },
            contact: { name: 'Contact 2', phone: '555-0002', email: 'c0002@fake.it' },
            startDate: '1574846420902', tenor: 52, currency: 'HKD', requestedAmt: 42.9,
            comment: 'Org2 LoanDetails 2'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createLoanDetails.id).toEqual(loanId2))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Multi-Org Test - Initialize Org3', () => {
  it('apply loan 3', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: {
            userId: userId3, loanId: loanId3,
            description: 'Org3 Loan 3',
            reference: 'REF-ORG3-LOAN-3',
            comment: 'Hello 0003'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.applyLoan.id).toEqual(loanId3))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('submit document without customized field', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT_CUST,
          variables: {
            userId: userId3, documentId: docId3a, loanId: loanId3,
            title: 'Org3 Document 1',
            reference: 'REF-ORG3-DOC-1',
            link: ''
          }})})
        .then(res => res.json())
        .then(({ errors }) => expect(errors.reduce((acc, cur) =>
          cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('submit document 3a', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT_CUST,
          variables: {
            userId: userId3, documentId: docId3a, loanId: loanId3,
            title: 'Org3 Document 1',
            reference: 'REF-ORG3-DOC-1',
            link: 'Org3-Customized-Link-a'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocument.id).toEqual(docId3a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('submit document 3b', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT_CUST,
          variables: {
            userId: userId3, documentId: docId3b, loanId: loanId3,
            title: 'Org3 Document 2',
            reference: 'REF-ORG3-DOC-2',
            link: 'Org3-Customized-Link-a'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocument.id).toEqual(docId3b))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add loanDetails without customized field', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId: userId3, loanId: loanId3,
            requester: { registration: 'BR1234567XXX3', name: 'Loan Requester 3' },
            contact: { name: 'Contact 3', phone: '555-9999', email: 'c0003@fake.it' },
            startDate: '1574846420903', tenor: 50, currency: 'HKD', requestedAmt: 43.9,
            comment: 'Org3 LoanDetails 3'
          }})})
        .then(res => res.json())
        .then(({ errors }) => expect(errors.reduce((acc, cur) =>
          cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add loanDetails to loan 3', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId: userId3, loanId: loanId3,
            requester: { registration: 'BR1234567XXX3', name: 'Loan Requester 3' },
            contact: { name: 'Contact 3', phone: '555-9999', email: 'c0003@fake.it', company: 'Shell' },
            startDate: '1574846420903', tenor: 50, currency: 'HKD', requestedAmt: 43.9,
            comment: 'Org3 LoanDetails 3'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createLoanDetails.id).toEqual(loanId3))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add docContents to document 3a', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS,
          variables: {
            userId: userId3, documentId: docId3a,
            content: { body: `{ "message": "Org3 docContents 1" }` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId3a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add docContents to document 3b', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS,
          variables: {
            userId: userId3, documentId: docId3b,
            content: { format: 'PDF', link: `http://fake.it/docs/org3DocContents-2.pdf` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId3b))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update doucment 3b with empty link', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'UpdateDocument',
          query: UPDATE_DOCUMENT_CUST,
          variables: {
            userId: userId3, documentId: docId3b, link: ''
          }})})
        .then(res => res.json())
        .then(({ errors }) => expect(errors.reduce((acc, cur) =>
          cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update doucment 3b', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'UpdateDocument',
          query: UPDATE_DOCUMENT_CUST,
          variables: {
            userId: userId3, documentId: docId3b, link: 'Org3-Customized-Link-b'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.updateDocument.map(d => (d && d.id) ? d.id : '')).toContain(docId3b))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update loanDetails 3 with empty company', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'UpdateLoanDetails',
          query: UPDATE_LOAN_DETAILS,
          variables: {
            userId: userId3, loanId: loanId3,
            contact: { company: '' }
          }})})
        .then(res => res.json())
        .then(({ errors }) => expect(errors.reduce((acc, cur) =>
          cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update loanDetails 3', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'UpdateLoanDetails',
          query: UPDATE_LOAN_DETAILS,
          variables: {
            userId: userId3, loanId: loanId3,
            requester: { name: 'Loan Requester 999' },
            contact: { company: 'Shell Company', phone: '555-0003' },
            currency: '', tenor: 53
          }})})
        .then(res => res.json())
        .then(({ data, errors }) => {
          const errs = errors.map(e => e.message);
          expect(errs).toContain('Error: INVALID_OPERATION');
          expect(errs).toContain('Error: REQUIRED_DATA_MISSING');
          expect(data.updateLoanDetails.map(d => (d && d.id) ? d.id : '')).toContain(loanId3);
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Multi-Org Test - Add remote data', () => {
  it('org1 add docContents 2a for org2', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS,
          variables: {
            userId: userId1, documentId: docId2a,
            content: { body: `{ "message": "Org1 docContents 1 for Org2" }` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId2a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('org2 add loanDetails 1 for org1', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId: userId2, loanId: loanId1,
            requester: { registration: 'BR1234567XXX1', name: 'Loan Requester 1' },
            contact: { name: 'Contact 1', phone: '555-0001', email: 'c0001@fake.it' },
            startDate: '1574846420901', tenor: 51, currency: 'HKD', requestedAmt: 41.9,
            comment: 'Org2 LoanDetails 1 for Org1'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createLoanDetails.id).toEqual(loanId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('org3 add loanDetails 1 for org1', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId: userId3, loanId: loanId1,
            requester: { registration: 'BR1234567XXX1', name: 'Loan Requester 1' },
            contact: { name: 'Contact 1', phone: '555-0001', email: 'c0001@fake.it', company: 'Shell Company' },
            startDate: '1574846420901', tenor: 51, currency: 'USD', requestedAmt: 41.9,
            comment: 'Org3 LoanDetails 1 for Org1'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createLoanDetails.id).toEqual(loanId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('org3 add docContents 2a for org2', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS,
          variables: {
            userId: userId3, documentId: docId2a,
            content: { format: 'PDF', link: `http://fake.it/docs/org1DocContents-1-4org2.pdf` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId2a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Multi-Org Test - Query Loans', () => {
  it('query loan 1', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'GetLoanById', query: GET_LOAN_BY_ID_ORG1, variables: { loanId: loanId1 }
        })})
      .then(res => res.json())
      .then(({ data }) => expect(data.getLoanById).toMatchSnapshot())
      .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan 2', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'GetLoanById', query: GET_LOAN_BY_ID_ORG2, variables: { loanId: loanId2 }
        })})
      .then(res => res.json())
      .then(({ data }) => expect(data.getLoanById).toMatchSnapshot())
      .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan 3', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'GetLoanById', query: GET_LOAN_BY_ID_ORG3, variables: { loanId: loanId3 }
        })})
      .then(res => res.json())
      .then(({ data }) => expect(data.getLoanById).toMatchSnapshot())
      .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});