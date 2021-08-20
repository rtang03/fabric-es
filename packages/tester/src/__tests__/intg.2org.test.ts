require('dotenv').config({ path: './.env' });
import fetch from 'node-fetch';
import {
  APPLY_LOAN,
  CREATE_DOC_CONTENTS,
  CREATE_DOCUMENT,
  CREATE_LOAN_DETAILS,
  CREATE_WALLET,
  GET_COMMITS_BY_DOCUMENT,
  GET_COMMITS_BY_LOAN,
  GET_DOCUMENT_BY_ID,
  GET_LOAN_BY_ID,
  SEARCH_DOCUMENT_BY_FIELDS,
  SEARCH_DOCUMENT_CONTAINS,
  SEARCH_LOAN_BY_FIELDS,
  SEARCH_LOAN_CONTAINS,
  UPDATE_DOC_CONTENTS,
  UPDATE_DOCUMENT,
  UPDATE_LOAN,
  SET_ACL,
} from '../ref-impl/queries';

// set NODE_EXTRA_CA_CERTS equals the CA cert
const PROTO = (process.env.USE_HTTPS && (process.env.USE_HTTPS === 'true')) ? 'https' : 'http';

const AUTH_REG_1 = `${PROTO}://${process.env.AUTH_HOST1}:${process.env.AUTH_PORT1}/account`;
const AUTH_LOG_1 = `${PROTO}://${process.env.AUTH_HOST1}:${process.env.AUTH_PORT1}/account/login`;
const AUTH_REG_2 = `${PROTO}://${process.env.AUTH_HOST2}:${process.env.AUTH_PORT2}/account`;
const AUTH_LOG_2 = `${PROTO}://${process.env.AUTH_HOST2}:${process.env.AUTH_PORT2}/account/login`;
const GATEWAY1 = `${PROTO}://${process.env.GATEWAY_HOST1}:${process.env.GATEWAY_PORT1}/graphql`;
const GATEWAY2 = `${PROTO}://${process.env.GATEWAY_HOST2}:${process.env.GATEWAY_PORT2}/graphql`;

const password = 'p@ssw0rd';
const timestamp = Date.now();

const userId1 = 'USER_ORG1';
const user1 =   `u1${timestamp}@org.example.com`;
const loanId1 = `l1${timestamp}`;
const docId1a = `d1${timestamp}`;
const docId1b = `d1${timestamp + 10}`;
const docId5a = `d5${timestamp}`;
const docId5d = `d5${timestamp + 10}`;
const admin1 = process.env.ROOT_ADMIN1;
const adminPwd1 = process.env.ROOT_ADMIN_PASSWORD1;

const userId2 = 'USER_ORG2';
const user2 =   `u2${timestamp}@org.example.com`;
const loanId2 = `l2${timestamp}`;
const docId2a = `d2${timestamp}`;
const docId2b = `d2${timestamp + 10}`;
const loanId5a = `l5a${timestamp}`;
const loanId5d = `l5d${timestamp}`;
const admin2 = process.env.ROOT_ADMIN2;
const adminPwd2 = process.env.ROOT_ADMIN_PASSWORD2;

let isReady = false;
let accessToken1;
let accessToken2;
let adminToken1;
let adminToken2;

beforeAll(async () => {
  try {
    console.log(`♨️♨️  Prepare Org1`);
    // Register Org1 user
    const { reg1, rol1 } = await fetch(AUTH_REG_1, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username: user1, email: user1, password
      })})
      .then(res => res.json())
      .then(data => {
        if (data.username && data.id) {
          return { reg1: true, rol1: data.id };
        } else {
          console.log(`Register Org1 user: ${JSON.stringify(data)}`);
          return { reg1: false, rol1: null };
        }
      });
    if (!reg1) {
      console.log(`♨️♨️  Registering to OAUTH server ${AUTH_REG_1} failed`);
      return;
    }
    // Login Org1 user
    const { log1, tok1 } = await fetch(AUTH_LOG_1, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username: user1, password
      })})
      .then(res => res.json())
      .then(data => {
        if (data.id === rol1) {
          return { log1: true, tok1: data.access_token };
        } else {
          console.log(`Login Org1 user: ${JSON.stringify(data)}`);
          return { log1: false, tok1: null };
        }
      });
    if (!log1) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_LOG_1} as ${user1} / ${password} failed`);
      return;
    }
    // Create wallet
    const org1Ready = await fetch(GATEWAY1, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${tok1}` }, body: JSON.stringify({
        operationName: 'CreateWallet', query: CREATE_WALLET
      })})
      .then(res => res.json())
      .then(({ data }) => data);
    if (!org1Ready) {
      console.log(`♨️♨️  Create wallet for user ${rol1} in gateway ${GATEWAY1} failed`);
      return;
    }
    accessToken1 = tok1;
    // Login admin1
    const { log1a, tok1a } = await fetch(AUTH_LOG_1, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username: admin1, password: adminPwd1
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.username === admin1) {
          return { log1a: true, tok1a: data.access_token };
        } else {
          console.log(`Login Org1 admin: ${JSON.stringify(data)}`);
          return { log1a: false, tok1a: null };
        }
      });
    if (!log1a) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_LOG_1} as ${admin1} / ${adminPwd1} failed`);
      return;
    }
    adminToken1 = tok1a;

    console.log(`♨️♨️  Prepare Org2`);
    // Register Org2 user
    const { reg2, rol2 } = await fetch(AUTH_REG_2, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username: user2, email: user2, password
      })})
      .then(res => res.json())
      .then(data => {
        if (data.username && data.id) {
          return { reg2: true, rol2: data.id };
        } else {
          console.log(`Register Org2 user: ${JSON.stringify(data)}`);
          return { reg2: false, rol2: null };
        }
      });
    if (!reg2) {
      console.log(`♨️♨️  Registering to OAUTH server ${AUTH_REG_2} failed`);
      return;
    }
    // Login Org2 user
    const { log2, tok2 } = await fetch(AUTH_LOG_2, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username: user2, password
      })})
      .then(res => res.json())
      .then(data => {
        if (data.id === rol2) {
          return { log2: true, tok2: data.access_token };
        } else {
          console.log(`Login Org2 user: ${JSON.stringify(data)}`);
          return { log2: false, tok2: null };
        }
      });
    if (!log2) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_LOG_2} as ${user2} / ${password} failed`);
      return;
    }
    // Create wallet
    const org2Ready = await fetch(GATEWAY2, {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${tok2}` }, body: JSON.stringify({
        operationName: 'CreateWallet', query: CREATE_WALLET
      })})
      .then(res => res.json())
      .then(({ data }) => data);
    if (!org2Ready) {
      console.log(`♨️♨️  Create wallet for user ${rol2} in gateway ${GATEWAY2} failed`);
      return;
    }
    accessToken2 = tok2;
    // Login admin2
    const { log2a, tok2a } = await fetch(AUTH_LOG_2, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        username: admin2, password: adminPwd2
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.username === admin2) {
          return { log2a: true, tok2a: data.access_token };
        } else {
          console.log(`Login Org2 admin: ${JSON.stringify(data)}`);
          return { log2a: false, tok2a: null };
        }
      });
    if (!log2a) {
      console.log(`♨️♨️  Logging in to OAUTH server ${AUTH_LOG_2} as ${admin2} / ${adminPwd2} failed`);
      return;
    }
    adminToken2 = tok2a;

    isReady = org1Ready && org2Ready;
  } catch (e) {
    console.error(e);
    const sleep10 = new Promise((resolve) => setTimeout(() => resolve(true), 10000));
    await sleep10;
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
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${adminToken1}` }, body: JSON.stringify({
          operationName: `_SetAcl_docContents`,
          query: SET_ACL('docContents'),
          variables: { entityId: docId1a, accessors: ['Org2MSP', 'Org3MSP'] }
        })
      }).then(res => res.json())
        .then(({ data }) => expect(data['_set_acl_docContents']).toEqual(2))
        .catch(_ => expect(false).toBeTruthy());

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
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${adminToken1}` }, body: JSON.stringify({
          operationName: `_SetAcl_docContents`,
          query: SET_ACL('docContents'),
          variables: { entityId: docId1b, accessors: ['Org2MSP', 'Org3MSP'] }
        })
      }).then(res => res.json())
        .then(({ data }) => expect(data['_set_acl_docContents']).toEqual(2))
        .catch(_ => expect(false).toBeTruthy());

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

  // TODO FIX handler! cannot return null for all errors!!!!!!!!!!!!!!
  // it('overwrite loan 1', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY1, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
  //         operationName: 'ApplyLoan', query: APPLY_LOAN,
  //         variables: {
  //           userId: userId1, loanId: loanId1,
  //           description: 'Org1 Loan 1 OVERWRITTEN',
  //           reference: 'REF-ORG1-LOAN-1-OVERWRITTEN',
  //           comment: 'Hello 0001 OVERWRITTEN'
  //         }})})
  //       .then(res => res.json())
  //       .then(({ errors }) => expect(errors.reduce((acc, cur) =>
  //         cur.message.includes('already started') ? cur.message : acc, '')).toContain('already started'))
  //       .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

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
            comment: `Comment 1 ${timestamp}`
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

  it('update doucment 1a', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'UpdateDocument',
          query: UPDATE_DOCUMENT,
          variables: {
            userId: userId1, documentId: docId1a, title: 'Org1 Document 1CHANGED'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.updateDocument.map(d => (d && d.id) ? d.id : '')).toContain(docId1a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update docContents of document 1a', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'UpdateDocContents',
          query: UPDATE_DOC_CONTENTS,
          variables: {
            userId: userId1, documentId: docId1a,
            content: { body: `{ "message": "Org1 docContents 1CHANGED" }` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.updateDocContents.id).toEqual(docId1a))
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
            comment: `Comment 2 ${timestamp}`
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
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${adminToken2}` }, body: JSON.stringify({
          operationName: `_SetAcl_loanDetails`,
          query: SET_ACL('loanDetails'),
          variables: { entityId: loanId2, accessors: ['Org1MSP', 'Org3MSP'] }
        })
      }).then(res => res.json())
        .then(({ data }) => expect(data['_set_acl_loanDetails']).toEqual(2))
        .catch(_ => expect(false).toBeTruthy());

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

describe('Multi-Org Test - Add remote data', () => {
  it('org1 add docContents 2a for org2', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${adminToken1}` }, body: JSON.stringify({
          operationName: `_SetAcl_docContents`,
          query: SET_ACL('docContents'),
          variables: { entityId: docId2a, accessors: ['Org2MSP', 'Org3MSP'] }
        })
      }).then(res => res.json())
        .then(({ data }) => expect(data['_set_acl_docContents']).toEqual(2))
        .catch(_ => expect(false).toBeTruthy());

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
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${adminToken2}` }, body: JSON.stringify({
          operationName: `_SetAcl_loanDetails`,
          query: SET_ACL('loanDetails'),
          variables: { entityId: loanId1, accessors: ['Org1MSP', 'Org3MSP'] }
        })
      }).then(res => res.json())
        .then(({ data }) => expect(data['_set_acl_loanDetails']).toEqual(2))
        .catch(_ => expect(false).toBeTruthy());

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
});

describe('Multi-Org Test - Query Loans', () => {
  it('query loan 1', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'GetLoanById', query: GET_LOAN_BY_ID, variables: { loanId: loanId1 }
        })})
        .then(res => res.json())
        .then(({ data }) => expect(data.getLoanById).toMatchSnapshot({
          comment: expect.any(String)
        }))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  // it('query loan 1 by field', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY1, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
  //         operationName: 'SearchLoanByFields', query: SEARCH_LOAN_BY_FIELDS, variables: { where: `{ "comment": "Comment 1 ${timestamp}" }` }
  //       })})
  //     .then(res => res.json())
  //     .then(({ data }) => expect(data.searchLoanByFields).toMatchSnapshot())
  //     .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

  // it('query loan 1 contains', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY1, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
  //         operationName: 'SearchLoanContains', query: SEARCH_LOAN_CONTAINS, variables: { contains: ''+timestamp }
  //       })})
  //     .then(res => res.json())
  //     .then(({ data }) => expect(data.searchLoanContains).toMatchSnapshot())
  //     .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

  it('query loan 2', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'GetLoanById', query: GET_LOAN_BY_ID, variables: { loanId: loanId2 }
        })})
        .then(res => res.json())
        .then(({ data }) => expect(data.getLoanById).toMatchSnapshot({
          comment: expect.any(String)
        }))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  // it('query loan 2 by field', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY2, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
  //         operationName: 'SearchLoanByFields', query: SEARCH_LOAN_BY_FIELDS, variables: { where: `{ "comment": "Comment 2 ${timestamp}" }` }
  //       })})
  //     .then(res => res.json())
  //     .then(({ data }) => expect(data.searchLoanByFields).toMatchSnapshot())
  //     .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

  // it('query loan 2 contains', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY2, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
  //         operationName: 'SearchLoanContains', query: SEARCH_LOAN_CONTAINS, variables: { contains: ''+timestamp }
  //       })})
  //     .then(res => res.json())
  //     .then(({ data }) => expect(data.searchLoanContains).toMatchSnapshot())
  //     .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

  it('query document 1a', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'GetDocumentById', query: GET_DOCUMENT_BY_ID, variables: { documentId: docId1a }
        })})
        .then(res => res.json())
        .then(({ data }) => expect(data.getDocumentById).toMatchSnapshot({
          documentId: expect.any(String), loanId: expect.any(String), timestamp: expect.any(String),
          loan: {
            loanId: expect.any(String), timestamp: expect.any(String),
          }
        }))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query document 2b', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'GetDocumentById', query: GET_DOCUMENT_BY_ID, variables: { documentId: docId2b }
        })})
        .then(res => res.json())
        .then(({ data }) => expect(data.getDocumentById).toMatchSnapshot({
          documentId: expect.any(String), loanId: expect.any(String), timestamp: expect.any(String),
          loan: {
            loanId: expect.any(String), timestamp: expect.any(String),
          }
        }))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  // it('query document 1 by field', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY1, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
  //         operationName: 'SearchDocumentByFields', query: SEARCH_DOCUMENT_BY_FIELDS, variables: { where: `{ "loanId": "${loanId1}" }` }
  //       })})
  //     .then(res => res.json())
  //     .then(({ data }) => expect(data.searchDocumentByFields).toMatchSnapshot())
  //     .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

  // it('query document 1 contains', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY1, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
  //         operationName: 'SearchDocumentContains', query: SEARCH_DOCUMENT_CONTAINS, variables: { contains: loanId1 }
  //       })})
  //     .then(res => res.json())
  //     .then(({ data }) => expect(data.searchDocumentContains).toMatchSnapshot())
  //     .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

  // it('query document 2 by field', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY2, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
  //         operationName: 'SearchDocumentByFields', query: SEARCH_DOCUMENT_BY_FIELDS, variables: { where: `{ "loanId": "${loanId2}" }` }
  //       })})
  //     .then(res => res.json())
  //     .then(({ data }) => expect(data.searchDocumentByFields).toMatchSnapshot())
  //     .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

  // it('query document 2 contains', async () => {
  //   if (isReady) {
  //     await fetch(GATEWAY2, {
  //       method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
  //         operationName: 'SearchDocumentContains', query: SEARCH_DOCUMENT_CONTAINS, variables: { contains: loanId2 }
  //       })})
  //     .then(res => res.json())
  //     .then(({ data }) => expect(data.searchDocumentContains).toMatchSnapshot())
  //     .catch(_ => expect(false).toBeTruthy());
  //     return;
  //   }
  //   expect(false).toBeTruthy();
  // });

  it('query loan 1 commits', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'GetCommitsByLoanId', query: GET_COMMITS_BY_LOAN, variables: { loanId: loanId1 }
        })
      }).then(res => res.json())
        .then(({ data }) => data.getCommitsByLoanId.forEach(commit => expect(commit).toMatchSnapshot({
          id: expect.any(String),
          commitId: expect.any(String),
        })))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query document 2b commits', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'GetCommitsByDocument', query: GET_COMMITS_BY_DOCUMENT, variables: { documentId: docId2a }
        })})
        .then(res => res.json())
        .then(({ data }) => expect(data.getCommitsByDocumentId).toMatchSnapshot())
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Multi-Org Test - Access Control of private data', () => {
  // Org2 create loan and loanDetail
  // loanDetail 5a allow Org1 to access
  // loanDetail 5d not allow other Org to access
  // docContent 5a allow Org2 to access
  // docContent 5d not allow other Org to access
  it('Org2 - add loan 5a ', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` },
        body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: {
            userId: userId2, loanId: loanId5a,
            description: 'Org2 Loan 5a',
            reference: 'REF-ORG2-LOAN-5a',
            comment: `Comment 5a ${timestamp}`
          }
        })
      })
        .then(res => res.json())
        .then(({ error, data }) => {
          expect(error).toBeUndefined();
          expect(data.applyLoan.id).toEqual(loanId5a);
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org2 - add loanDetails 5a for Org1', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${adminToken2}` }, body: JSON.stringify({
          operationName: `_SetAcl_loanDetails`,
          query: SET_ACL('loanDetails'),
          variables: { entityId: loanId5a, accessors: ['Org1MSP'] }
        })
      }).then(res => res.json())
        .then(({ data }) => expect(data['_set_acl_loanDetails']).toEqual(1))
        .catch(_ => expect(false).toBeTruthy());

      await fetch(GATEWAY2, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` },
        body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId: userId2, loanId: loanId5a,
            requester: { registration: 'BR1234567XXX1', name: 'Loan Requester 5a' },
            contact: { name: 'Contact 5', phone: '555-0001', email: 'c0001@fake.it' },
            startDate: '1574846420901', tenor: 51, currency: 'HKD', requestedAmt: 41.9,
            comment: 'Org2 LoanDetails 5a for Org1'
          }
        })
      })
        .then(res => res.json())
        .then(({ error, data }) => {
          expect(error).toBeUndefined();
          expect(data.createLoanDetails.id).toEqual(loanId5a);
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org2 - add loan 5d ', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` }, body: JSON.stringify({
          operationName: 'ApplyLoan', query: APPLY_LOAN,
          variables: {
            userId: userId2, loanId: loanId5d,
            description: 'Org2 Loan 5d',
            reference: 'REF-ORG2-LOAN-5d',
            comment: `Comment 5d ${timestamp}`
          }
        })
      })
        .then(res => res.json())
        .then(({ error, data }) => {
          expect(error).toBeUndefined();
          expect(data.applyLoan.id).toEqual(loanId5d);
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org2 - add loanDetails 5d for Org2', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` },
        body: JSON.stringify({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS,
          variables: {
            userId: userId2, loanId: loanId5d,
            requester: { registration: 'BR1234567XXX1', name: 'Loan Requester 5d' },
            contact: { name: 'Contact 5d', phone: '555-0001', email: 'c0001@fake.it' },
            startDate: '1574846420901', tenor: 51, currency: 'HKD', requestedAmt: 41.9,
            comment: 'Org2 LoanDetails 5d for Org2'
          }
        })
      })
        .then(res => res.json())
        .then(({ error, data }) => {
          expect(error).toBeUndefined();
          expect(data.createLoanDetails.id).toEqual(loanId5d);
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org1 - add document 5a ', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT,
          variables: {
            userId: userId1, documentId: docId5a, loanId: loanId5a,
            title: 'Org1 Document 1',
            reference: 'REF-ORG1-DOC-1'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocument.id).toEqual(docId5a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org1 - add docContents 5a for Org2', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${adminToken1}` }, body: JSON.stringify({
          operationName: `_SetAcl_docContents`,
          query: SET_ACL('docContents'),
          variables: { entityId: docId5a, accessors: ['Org2MSP'] }
        })
      }).then(res => res.json())
        .then(({ data }) => expect(data['_set_acl_docContents']).toEqual(1))
        .catch(_ => expect(false).toBeTruthy());

      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS,
          variables: {
            userId: userId1, documentId: docId5a,
            content: { body: `{ "message": "Org1 docContents 1" }` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId5a))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org1 - add document 5d ', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT,
          variables: {
            userId: userId1, documentId: docId5d, loanId: loanId5d,
            title: 'Org1 Document 1',
            reference: 'REF-ORG1-DOC-1'
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocument.id).toEqual(docId5d))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org1 - add docContents 5d', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` }, body: JSON.stringify({
          operationName: 'CreateDocContents',
          query: CREATE_DOC_CONTENTS,
          variables: {
            userId: userId1, documentId: docId5d,
            content: { body: `{ "message": "Org1 docContents 1" }` }
          }})})
        .then(res => res.json())
        .then(({ data }) => expect(data.createDocContents.id).toEqual(docId5d))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org2 - query loan 5a with loanDetails and docContents', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` },
        body: JSON.stringify({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId5a }
        })
      })
        .then(res => res.json())
        .then(({ error, data }) => {
          expect(error).toBeUndefined();
          expect(data.getLoanById).toMatchSnapshot({
            comment: expect.any(String)
          });
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org2 - query loan 5d with loanDetails only', async () => {
    if (isReady) {
      await fetch(GATEWAY2, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken2}` },
        body: JSON.stringify({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId5d }
        })
      })
        .then(res => res.json())
        .then(({ error, data }) => {
          expect(error).toBeUndefined();
          expect(data.getLoanById).toMatchSnapshot({
            comment: expect.any(String)
          });
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  // Query testing on Org1
  it('Org1 - query loan 5a with loanDetails and docContents', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` },
        body: JSON.stringify({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId5a }
        })
      })
        .then(res => res.json())
        .then(({ error, data }) => {
          expect(error).toBeUndefined();
          expect(data.getLoanById).toMatchSnapshot({
            comment: expect.any(String)
          });
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('Org1 - query loan 5d with docContents only', async () => {
    if (isReady) {
      await fetch(GATEWAY1, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken1}` },
        body: JSON.stringify({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId5d }
        })
      })
        .then(res => res.json())
        .then(({ error, data }) => {
          expect(error).toBeUndefined();
          expect(data.getLoanById).toMatchSnapshot({
            comment: expect.any(String)
            // loanDetails should be empty
          });
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});
