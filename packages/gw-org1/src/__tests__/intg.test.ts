require('../env');
import { getReducer } from '@espresso/fabric-cqrs';
import { createAdminService, createGateway, createService } from '@espresso/gw-node';
import {
  APPLY_LOAN,
  APPROVE_LOAN,
  CANCEL_LOAN,
  CREATE_DOCUMENT,
  DELETE_DOCUMENT,
  Document,
  DocumentEvents,
  documentReducer,
  documentResolvers,
  documentTypeDefs,
  EXPIRE_LOAN,
  Loan,
  LoanEvents,
  loanReducer,
  loanResolvers,
  loanTypeDefs,
  REJECT_LOAN,
  RESTRICT_DOCUMENT_ACCESS,
  RETURN_LOAN,
  UPDATE_DOCUMENT,
  UPDATE_LOAN
} from '@espresso/model-loan';
import {
  CREATE_DATA_DOC_CONTENTS,
  CREATE_FILE_DOC_CONTENTS,
  CREATE_LOAN_DETAILS,
  DocContents,
  DocContentsEvents,
  docContentsReducer,
  docContentsResolvers,
  docContentsTypeDefs,
  LoanDetails,
  LoanDetailsEvents,
  loanDetailsReducer,
  loanDetailsResolvers,
  loanDetailsTypeDefs
} from '@espresso/model-loan-private';
import { ApolloServer } from 'apollo-server';
import { Express } from 'express';
import { FileSystemWallet } from 'fabric-network';
import fetch from 'node-fetch';
import request from 'supertest';
import {
  GET_COMMITS_BY_DOCUMENT,
  GET_COMMITS_BY_LOAN,
  GET_DOCUMENT_BY_ID,
  GET_LOAN_BY_ID,
  GW_REGISTER_ENROLL,
  OAUTH_LOGIN,
  OAUTH_REGISTER
} from './__utils__/queries';

const aPort = 15050;
const lPort = 14052;
const dPort = 14053;
const tPort = 14054;
const cPort = 14055;
const lReducer = getReducer<Loan, LoanEvents>(loanReducer);
const dReducer = getReducer<Document, DocumentEvents>(documentReducer);
const tReducer = getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer);
const cReducer = getReducer<DocContents, DocContentsEvents>(docContentsReducer);

const AUTH_SERVER = `http://localhost:${process.env.OAUTH_SERVER_PORT}/graphql`;
const ADMIN_SERVICE = `http://localhost:${aPort}/graphql`;

const timestamp = Date.now();
const email = `u${timestamp}@${process.env.ORGNAME}`;
const password = 'p@ssw0rd';
const username = `u${timestamp}`;
const loanId0 = `l${timestamp}`;
const loanId1 = `l${timestamp + 10}`;
const loanId2 = `l${timestamp + 20}`;
const loanId3 = `l${timestamp + 30}`;
const loanId4 = `l${timestamp + 40}`;
const loanId5 = `l${timestamp + 50}`;
const documentId0 = `d${timestamp}`;
const documentId1 = `d${timestamp + 10}`;
const documentId2 = `d${timestamp + 20}`;
const documentId3 = `d${timestamp + 30}`;
const documentId4 = `d${timestamp + 40}`;
const documentId5 = `d${timestamp + 50}`;
const documentId6 = `d${timestamp + 60}`;
const documentId7 = `d${timestamp + 70}`;

let adminService: ApolloServer;
let loanService: ApolloServer;
let loanUnsubscribe: any;
let loanDisconnect: any;
let docuService: ApolloServer;
let docuUnsubscribe: any;
let docuDisconnect: any;
let dtlsService: ApolloServer;
let dtlsDisconnect: any;
let ctntService: ApolloServer;
let ctntDisconnect: any;
let gateway: Express;

let isAuthenticated = false;
let isReady = false;
let accessToken;

beforeAll(async () => {
  const registered = await fetch(AUTH_SERVER, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      operationName: 'Register',
      query: OAUTH_REGISTER,
      variables: { email, username, password }
    })
  })
    .then(res => res.json())
    .then(({ data, errors }) => data || errors[0].message === 'already exist');

  if (registered) {
    const { loggedIn, enrollmentId, token } = await fetch(AUTH_SERVER, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operationName: 'Login',
        query: OAUTH_LOGIN,
        variables: { email, password }
      })
    })
      .then(res => res.json())
      .then(({ data }) => {
        if (data.login.ok) {
          return {
            loggedIn: true,
            enrollmentId: data.login.user.id,
            token: data.login.accessToken
          };
        }
      });

    if (loggedIn) {
      isAuthenticated = true;
      accessToken = token;

      // Start admin service
      ({ server: adminService } = await createAdminService({
        ordererName: process.env.ORDERER_NAME,
        ordererTlsCaCert: process.env.ORDERER_TLSCA_CERT,
        peerName: process.env.PEER_NAME,
        caAdminEnrollmentId: process.env.CA_ENROLLMENT_ID_ADMIN,
        channelName: process.env.CHANNEL_NAME,
        connectionProfile: process.env.CONNECTION_PROFILE,
        fabricNetwork: process.env.NETWORK_LOCATION,
        walletPath: process.env.WALLET
      }));
      adminService.listen({ port: aPort });

      isReady = await fetch(ADMIN_SERVICE, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `bearer ${accessToken}` },
        body: JSON.stringify({
          operationName: 'RegisterAndEnrollUser',
          query: GW_REGISTER_ENROLL,
          variables: {
            enrollmentId,
            enrollmentSecret: 'password',
            administrator: process.env.CA_ENROLLMENT_ID_ADMIN
          }
        })
      })
        .then(res => res.json())
        .then(({ data }) => data);

      if (isReady) {
        // Start loan service
        await createService({
          enrollmentId: process.env.ORG_ADMIN_ID,
          defaultEntityName: 'loan',
          defaultReducer: lReducer,
          collection: process.env.COLLECTION,
          channelEventHub: process.env.CHANNEL_HUB,
          channelName: process.env.CHANNEL_NAME,
          connectionProfile: process.env.CONNECTION_PROFILE,
          wallet: new FileSystemWallet(process.env.WALLET)
        }).then(async ({ config, getRepository, unsubscribeHub, disconnect }) => {
          loanUnsubscribe = unsubscribeHub;
          loanDisconnect = disconnect;
          loanService = await config({ typeDefs: loanTypeDefs, resolvers: loanResolvers })
            .addRepository(
              getRepository<Loan, LoanEvents>({ entityName: 'loan', reducer: lReducer })
            )
            .create();
          await loanService
            .listen({ port: lPort })
            .then(({ url }) => console.log(`🚀  ${process.env.ORGNAME} unit test`, 'loan available at', url));
        });

        // Start document service
        await createService({
          enrollmentId: process.env.ORG_ADMIN_ID,
          defaultEntityName: 'document',
          defaultReducer: dReducer,
          collection: process.env.COLLECTION,
          channelEventHub: process.env.CHANNEL_HUB,
          channelName: process.env.CHANNEL_NAME,
          connectionProfile: process.env.CONNECTION_PROFILE,
          wallet: new FileSystemWallet(process.env.WALLET)
        }).then(async ({ config, getRepository, unsubscribeHub, disconnect }) => {
          docuUnsubscribe = unsubscribeHub;
          docuDisconnect = disconnect;
          docuService = await config({ typeDefs: documentTypeDefs, resolvers: documentResolvers })
            .addRepository(
              getRepository<Document, DocumentEvents>({ entityName: 'document', reducer: dReducer })
            )
            .create();
          await docuService
            .listen({ port: dPort })
            .then(({ url }) => console.log(`🚀  ${process.env.ORGNAME} unit test`, 'document available at', url));
        });

        // Start loan-details service
        await createService({
          enrollmentId: process.env.ORG_ADMIN_ID,
          defaultEntityName: 'loanDetails',
          defaultReducer: tReducer,
          collection: process.env.COLLECTION,
          isPrivate: true,
          channelEventHub: process.env.CHANNEL_HUB,
          channelName: process.env.CHANNEL_NAME,
          connectionProfile: process.env.CONNECTION_PROFILE,
          wallet: new FileSystemWallet(process.env.WALLET)
        }).then(async ({ config, getPrivateDataRepo, disconnect }) => {
          dtlsDisconnect = disconnect;
          dtlsService = await config({ typeDefs: loanDetailsTypeDefs, resolvers: loanDetailsResolvers })
            .addRepository(
              getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({ entityName: 'loanDetails', reducer: tReducer })
            )
            .create();
          await dtlsService
            .listen({ port: tPort })
            .then(({ url }) => console.log(`🚀  ${process.env.ORGNAME} unit test`, 'loan-details available at', url));
        });

        // Start doc-contents service
        await createService({
          enrollmentId: process.env.ORG_ADMIN_ID,
          defaultEntityName: 'docContents',
          defaultReducer: cReducer,
          collection: process.env.COLLECTION,
          isPrivate: true,
          channelEventHub: process.env.CHANNEL_HUB,
          channelName: process.env.CHANNEL_NAME,
          connectionProfile: process.env.CONNECTION_PROFILE,
          wallet: new FileSystemWallet(process.env.WALLET)
        }).then(async ({ config, getPrivateDataRepo, disconnect }) => {
          ctntDisconnect = disconnect;
          ctntService = await config({ typeDefs: docContentsTypeDefs, resolvers: docContentsResolvers })
            .addRepository(
              getPrivateDataRepo<DocContents, DocContentsEvents>({ entityName: 'docContents', reducer: cReducer })
            )
            .create();
          await ctntService
            .listen({ port: cPort })
            .then(({ url }) => console.log(`🚀  ${process.env.ORGNAME} unit test`, 'doc-contents available at', url));
        });

        // Start federated gateway
        gateway = await createGateway({
          serviceList: [
            { name: 'admin',       url: ADMIN_SERVICE },
            { name: 'loan',        url: `http://localhost:${lPort}/graphql` },
            { name: 'document',    url: `http://localhost:${dPort}/graphql` },
            { name: 'loanDetails', url: `http://localhost:${tPort}/graphql` },
            { name: 'docContents', url: `http://localhost:${cPort}/graphql` }
          ],
          authenticationCheck: process.env.AUTHORIZATION_SERVER_URI,
          useCors: true,
          debug: false
        });
      }
    }
  }
});

afterAll(async () => {
  if (isAuthenticated) {
    await adminService.stop();
  }

  if (isReady) {
    docuUnsubscribe();
    loanUnsubscribe();
    ctntDisconnect();
    dtlsDisconnect();
    docuDisconnect();
    loanDisconnect();
    await ctntService.stop();
    await dtlsService.stop();
    await docuService.stop();
    await loanService.stop();
  }

  return new Promise(done =>
    setTimeout(() => {
      console.log('🚀  Test finished');
      done();
    }, 500)
  );
});

describe('Unit Test: Org1 Apply Loans', () => {
  it('apply loan', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ApplyLoan',
          query: APPLY_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId0,
            description: 'Org1 unit test loan 0',
            reference: 'REF-UNIT-TEST-LOAN-0'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.applyLoan.id).toEqual(loanId0))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('add loan details', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateLoanDetails',
          query: CREATE_LOAN_DETAILS.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId0,
            registration: `BR-UNIT-TEST`,
            companyName: 'Unit Test and Co. Ltd.',
            contactName: 'Jerk',
            contactPhone: '555-1234-5678',
            contactEmail: 'jerk@fake.it',
            startDate: '1574846420902',
            tenor: 59,
            currency: 'HKD',
            requestedAmt: 43.9,
            comment: `Org1 unit test loan-details`
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createLoanDetails.id).toEqual(loanId0))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('apply loan 1', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ApplyLoan',
          query: APPLY_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId1,
            description: 'Org1 unit test loan 1',
            reference: 'REF-UNIT-TEST-LOAN-1'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.applyLoan.id).toEqual(loanId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('apply loan 2', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ApplyLoan',
          query: APPLY_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId2,
            description: 'Org1 unit test loan 2',
            reference: 'REF-UNIT-TEST-LOAN-2'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.applyLoan.id).toEqual(loanId2))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('apply loan 3', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ApplyLoan',
          query: APPLY_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId3,
            description: 'Org1 unit test loan 3',
            reference: 'REF-UNIT-TEST-LOAN-3'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.applyLoan.id).toEqual(loanId3))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('apply loan 4', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ApplyLoan',
          query: APPLY_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId4,
            description: 'Org1 unit test loan 4',
            reference: 'REF-UNIT-TEST-LOAN-4'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.applyLoan.id).toEqual(loanId4))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('apply loan 5', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ApplyLoan',
          query: APPLY_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId5,
            description: 'Org1 unit test loan 5',
            reference: 'REF-UNIT-TEST-LOAN-5'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.applyLoan.id).toEqual(loanId5))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Unit Test: Org1 Create Documents', () => {
  it('create document 0', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId0,
            loanId: loanId0,
            title: 'Org1 unit test document 0',
            reference: 'REF-UNIT-TEST-DOC-0'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId0))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create doc contents - data', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDataDocContents',
          query: CREATE_DATA_DOC_CONTENTS.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId0,
            body: `{ "message": "Org1 unit test doc-contents 0" }`
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDataDocContents.id).toEqual(documentId0))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create document 1', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId1,
            loanId: loanId0,
            title: 'Org1 unit test document 0',
            reference: 'REF-UNIT-TEST-DOC-1'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create doc contents - file', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateFileDocContents',
          query: CREATE_FILE_DOC_CONTENTS.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId1,
            format: 'PDF',
            link: `http://fake.it/docs/org1UnitTestDocContents-1.pdf`
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createFileDocContents.id).toEqual(documentId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create document 2', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId2,
            loanId: loanId0,
            title: 'Org1 unit test document 2',
            reference: 'REF-UNIT-TEST-DOC-2'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId2))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create document 3', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId3,
            loanId: loanId1,
            title: 'Org1 unit test document 3',
            reference: 'REF-UNIT-TEST-DOC-3'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId3))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create document 4', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId4,
            loanId: loanId2,
            title: 'Org1 unit test document 4',
            reference: 'REF-UNIT-TEST-DOC-4'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId4))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create document 5', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId5,
            loanId: loanId3,
            title: 'Org1 unit test document 5',
            reference: 'REF-UNIT-TEST-DOC-5'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId5))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create document 6', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId6,
            loanId: loanId4,
            title: 'Org1 unit test document 6',
            reference: 'REF-UNIT-TEST-DOC-6'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId6))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create document 7', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId7,
            loanId: loanId5,
            title: 'Org1 unit test document 7',
            reference: 'REF-UNIT-TEST-DOC-7'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId7))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Unit Test: Org1 Documents', () => {
  it('update document 1', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'UpdateDocument',
          query: UPDATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId1,
            title: 'Org1 unit test document 1'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.updateDocument[0].id).toEqual(documentId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update readonly field of document 1', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'UpdateDocument',
          query: UPDATE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId1,
            reference: 'REF-UNIT-TEST-DOC-2'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.updateDocument[0].message).toEqual('INVALID_OPERATION'))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update document status', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'RestrictAccess',
          query: RESTRICT_DOCUMENT_ACCESS.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId1
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.restrictAccess.id).toEqual(documentId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('delete document', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'DeleteDocument',
          query: DELETE_DOCUMENT.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            documentId: documentId2
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.deleteDocument.id).toEqual(documentId2))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Unit Test: Org1 Loans', () => {
  it('cancel loan', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CancelLoan',
          query: CANCEL_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId1
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.cancelLoan.id).toEqual(loanId1))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('approve loan', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ApproveLoan',
          query: APPROVE_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId2
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.approveLoan.id).toEqual(loanId2))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('return loan', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ReturnLoan',
          query: RETURN_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId3
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.returnLoan.id).toEqual(loanId3))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('reject loan', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'RejectLoan',
          query: REJECT_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId4
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.rejectLoan.id).toEqual(loanId4))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('reject loan', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ExpireLoan',
          query: EXPIRE_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId5
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.expireLoan.id).toEqual(loanId5))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update loan 2', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'UpdateLoan',
          query: UPDATE_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId2,
            description: 'Org1 unit test loan 2 EDITED'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.updateLoan[0].id).toEqual(loanId2))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('update readonly field of loan 2', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'UpdateLoan',
          query: UPDATE_LOAN.loc.source.body,
          variables: {
            userId: 'unitTestUser',
            loanId: loanId2,
            reference: 'REF-UNIT-TEST-LOAN-2NEW'
          }
        })
        .expect(({ body: { data, errors } }) => expect(data.updateLoan[0].message).toEqual('INVALID_OPERATION'))
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});

describe('Unit Test: Org1 Queries', () => {
  it('query commits of document', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetCommitsByDocument',
          query: GET_COMMITS_BY_DOCUMENT,
          variables: { documentId: documentId1 }
        })
        .expect(({ body: { data, errors } }) => {
          expect(data.getCommitsByDocumentId).toMatchSnapshot();
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query commits of loan', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetCommitsByLoanId',
          query: GET_COMMITS_BY_LOAN,
          variables: { loanId: loanId3 }
        })
        .expect(({ body: { data, errors } }) => expect(data.getCommitsByLoanId).toMatchSnapshot())
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query document by id', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetDocumentById',
          query: GET_DOCUMENT_BY_ID,
          variables: { documentId: documentId0 }
        })
        .expect(({ body: { data, errors } }) => {
          expect(data.getDocumentById).toMatchSnapshot();
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan by id', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId0 }
        })
        .expect(({ body: { data, errors } }) => {
          expect(data.getLoanById).toMatchSnapshot();
        })
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan by id 1', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId1 }
        })
        .expect(({ body: { data, errors } }) => expect(data.getLoanById).toMatchSnapshot())
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan by id 2', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId2 }
        })
        .expect(({ body: { data, errors } }) => expect(data.getLoanById).toMatchSnapshot())
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan by id 3', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId3 }
        })
        .expect(({ body: { data, errors } }) => expect(data.getLoanById).toMatchSnapshot())
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan by id 4', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId4 }
        })
        .expect(({ body: { data, errors } }) => expect(data.getLoanById).toMatchSnapshot())
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan by id 5', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId: loanId5 }
        })
        .expect(({ body: { data, errors } }) => expect(data.getLoanById).toMatchSnapshot())
        .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});
