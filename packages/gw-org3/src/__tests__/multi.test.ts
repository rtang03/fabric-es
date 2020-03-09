import {
  APPLY_LOAN,
  CREATE_DOCUMENT
} from '@espresso/model-loan';
import {
  CREATE_DOC_CONTENTS
} from '@espresso/model-loan-private';
import fetch from 'node-fetch';
import {
  CREATE_DOCUMENT_CUST,
  GET_COMMITS_BY_DOCUMENT,
  GET_COMMITS_BY_LOAN,
  GET_DOCUMENT_BY_ID,
  GET_LOAN_BY_ID_ORG1,
  GET_LOAN_BY_ID_ORG2,
  GET_LOAN_BY_ID_ORG3,
  GW_REGISTER_ENROLL,
  OAUTH_LOGIN,
  OAUTH_REGISTER
} from './queries';

const PORT_GW1 = 4001;
const PORT_GW2 = 4002;
const PORT_GW3 = 4003;
const PORT_AUTH1 = 4100;
const PORT_AUTH2 = 4200;
const PORT_AUTH3 = 4300;

const AUTH_SERVER1 = `http://localhost:${PORT_AUTH1}/graphql`;
const AUTH_SERVER2 = `http://localhost:${PORT_AUTH2}/graphql`;
const AUTH_SERVER3 = `http://localhost:${PORT_AUTH3}/graphql`;
const GATEWAY1 = `http://localhost:${PORT_GW1}/graphql`;
const GATEWAY2 = `http://localhost:${PORT_GW2}/graphql`;
const GATEWAY3 = `http://localhost:${PORT_GW3}/graphql`;

const password = 'p@ssw0rd';
const timestamp = Date.now();

const userId1 = 'USER_ORG1';
const user1 =   `u1${timestamp}`;
const email1 =  `u1${timestamp}@org.example.com`;
const loanId1 = `l1${timestamp}`;
const docId1a = `d1${timestamp}`;
const docId1b = `d1${timestamp + 10}`;

const userId2 = 'USER_ORG2';
const user2 =   `u2${timestamp}`;
const email2 =  `u2${timestamp}@org.example.com`;
const loanId2 = `l2${timestamp}`;
const docId2a = `d2${timestamp}`;
const docId2b = `d2${timestamp + 10}`;

const userId3 = 'USER_ORG3';
const user3 =   `u3${timestamp}`;
const email3 =  `u3${timestamp}@org.example.com`;
const loanId3 = `l3${timestamp}`;
const docId3a = `d3${timestamp}`;
const docId3b = `d3${timestamp + 10}`;

let isReady = false;
let accessToken1;
let accessToken2;
let accessToken3;

beforeAll(async () => {
  console.log(`♨️♨️  Prepare Org1`);
  if (!await fetch(AUTH_SERVER1, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      operationName: 'Register', query: OAUTH_REGISTER,
      variables: { email: email1, username: user1, password }
    })})
  .then(res => res.json())
  .then(({ data }) => data)) {
    console.log(`♨️♨️  Registering to OAUTH server ${AUTH_SERVER1} failed`);
    return;
  }
  const { log1, rol1, tok1 } = await fetch(AUTH_SERVER1, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      operationName: 'Login', query: OAUTH_LOGIN,
      variables: { email: email1, password }
    })})
  .then(res => res.json())
  .then(({ data }) => {
    if (data.login.ok) return { log1: true, rol1: data.login.user.id, tok1: data.login.accessToken };
  });
  if (!log1) {
    console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER1} as ${email1} / ${password} failed`);
    return;
  }
  const org1Ready = await fetch(GATEWAY1, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${tok1}` }, body: JSON.stringify({
      operationName: 'RegisterAndEnrollUser', query: GW_REGISTER_ENROLL,
      variables: { enrollmentId: rol1, enrollmentSecret: 'password', administrator: 'rca-org1-admin' }
    })})
  .then(res => res.json())
  .then(({ data }) => data);
  if (!org1Ready) {
    console.log(`♨️♨️  Enrolling user ${rol1} to gateway ${GATEWAY1} failed`);
    return;
  }
  accessToken1 = tok1;

  console.log(`♨️♨️  Prepare Org2`);
  if (!await fetch(AUTH_SERVER2, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      operationName: 'Register', query: OAUTH_REGISTER,
      variables: { email: email2, username: user2, password }
    })})
  .then(res => res.json())
  .then(({ data }) => data)) {
    console.log(`♨️♨️  Registering to OAUTH server ${AUTH_SERVER2} failed`);
    return;
  }
  const { log2, rol2, tok2 } = await fetch(AUTH_SERVER2, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      operationName: 'Login', query: OAUTH_LOGIN,
      variables: { email: email2, password }
    })})
  .then(res => res.json())
  .then(({ data }) => {
    if (data.login.ok) return { log2: true, rol2: data.login.user.id, tok2: data.login.accessToken };
  });
  if (!log2) {
    console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER2} as ${email2} / ${password} failed`);
    return;
  }
  const org2Ready = await fetch(GATEWAY2, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${tok2}` }, body: JSON.stringify({
      operationName: 'RegisterAndEnrollUser', query: GW_REGISTER_ENROLL,
      variables: { enrollmentId: rol2, enrollmentSecret: 'password', administrator: 'rca-org2-admin' }
    })})
  .then(res => res.json())
  .then(({ data }) => data);
  if (!org2Ready) {
    console.log(`♨️♨️  Enrolling user ${rol2} to gateway ${GATEWAY2} failed`);
    return;
  }
  accessToken2 = tok2;

  console.log(`♨️♨️  Prepare Org3`);
  if (!await fetch(AUTH_SERVER3, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      operationName: 'Register', query: OAUTH_REGISTER,
      variables: { email: email3, username: user3, password }
    })})
  .then(res => res.json())
  .then(({ data }) => data)) {
    console.log(`♨️♨️  Registering to OAUTH server ${AUTH_SERVER3} failed`);
    return;
  }
  const { log3, rol3, tok3 } = await fetch(AUTH_SERVER3, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      operationName: 'Login', query: OAUTH_LOGIN,
      variables: { email: email3, password }
    })})
  .then(res => res.json())
  .then(({ data }) => {
    if (data.login.ok) return { log3: true, rol3: data.login.user.id, tok3: data.login.accessToken };
  });
  if (!log3) {
    console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_SERVER3} as ${email3} / ${password} failed`);
    return;
  }
  const org3Ready = await fetch(GATEWAY3, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${tok3}` }, body: JSON.stringify({
      operationName: 'RegisterAndEnrollUser', query: GW_REGISTER_ENROLL,
      variables: { enrollmentId: rol3, enrollmentSecret: 'password', administrator: 'rca-org3-admin' }
    })})
  .then(res => res.json())
  .then(({ data }) => data);
  if (!org3Ready) {
    console.log(`♨️♨️  Enrolling user ${rol3} to gateway ${GATEWAY3} failed`);
    return;
  }
  accessToken3 = tok3;

  isReady = org1Ready && org2Ready && org3Ready;
});

afterAll(async () => {
  console.log('Multi-Orgs test finished', timestamp);
});

describe('Multi-Org Test - Initialize Org1', () => {
  it('apply loan 1', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN.loc.source.body,
          variables: {
            userId: userId1, loanId: loanId1,
            description: 'Org1 Loan 1',
            reference: 'REF-ORG1-LOAN-1',
            comment: 'Hello 0001'
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
          query: CREATE_DOCUMENT.loc.source.body,
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
          query: CREATE_DOCUMENT.loc.source.body,
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
          query: CREATE_DOC_CONTENTS.loc.source.body,
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
          query: CREATE_DOC_CONTENTS.loc.source.body,
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
});

describe('Multi-Org Test - Initialize Org2', () => {
  it('apply loan 2', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN.loc.source.body,
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
          query: CREATE_DOCUMENT.loc.source.body,
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
          query: CREATE_DOCUMENT.loc.source.body,
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

  it('add docContents to document 2a', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS.loc.source.body,
          variables: {
            userId: userId2, documentId: docId2a,
            content: { body: `{ "message": "Org2 docContents 1" }` }
          }})})
        .then(res => res.json())
        .then(data => {
          console.log('YA org1', JSON.stringify(data));
          return data;
        })
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId2a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add docContents to document 2b', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS.loc.source.body,
          variables: {
            userId: userId2, documentId: docId2b,
            content: { format: 'PDF', link: `http://fake.it/docs/org2DocContents-2.pdf` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId2b))
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
          operationName: 'ApplyLoan', query: APPLY_LOAN.loc.source.body,
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

  it('add docContents to document 3a', async () => {
    if (isReady) {
      await fetch(GATEWAY3, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken3}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS.loc.source.body,
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
          query: CREATE_DOC_CONTENTS.loc.source.body,
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