require('../env');
import { getReducer } from '@espresso/fabric-cqrs';
import { createAdminService, createGateway, createService } from '@espresso/gw-node';
import {
  APPLY_LOAN, CREATE_DOCUMENT,
  Document, DocumentEvents, documentReducer, documentResolvers, documentTypeDefs,
  Loan, LoanEvents, loanReducer, loanResolvers, loanTypeDefs
} from '@espresso/model-loan';
import {
  CREATE_DATA_DOC_CONTENTS, CREATE_LOAN_DETAILS,
  DocContents, DocContentsEvents, docContentsReducer, docContentsResolvers, docContentsTypeDefs,
  LoanDetails, LoanDetailsEvents, loanDetailsReducer, loanDetailsResolvers, loanDetailsTypeDefs
} from '@espresso/model-loan-private';
import { ApolloServer } from 'apollo-server';
import { Express } from 'express';
import { FileSystemWallet } from 'fabric-network';
import fetch from 'node-fetch';
import request from 'supertest';
import {
  GET_LOAN_BY_ID,
  GW_REGISTER_ENROLL,
  OAUTH_LOGIN, OAUTH_REGISTER
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

const AUTH_SERVER   = `http://localhost:${process.env.OAUTH_SERVER_PORT}/graphql`;
const ADMIN_SERVICE = `http://localhost:${aPort}/graphql`;

const timestamp = Date.now();
const email = `u${timestamp}@${process.env.ORGNAME}`;
const password = 'p@ssw0rd';
const username = `u${timestamp}`;
const loanId = `l${timestamp}`;
const documentId = `d${timestamp}`;

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
  .then(({ data, errors }) => {
    return (data || errors[0].message === 'already exist');
  });

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
        headers: { 'content-type': 'application/json', 'authorization': `bearer ${accessToken}` },
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
      .then(({ data }) => {
        return data;
      });

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
            .addRepository(getRepository<Loan, LoanEvents>({ entityName: 'loan', reducer: lReducer })).create();
          await loanService.listen({ port: lPort }).then(({ url }) => console.log(`🚀  ${process.env.ORGNAME} unit test`, 'loan available at', url));
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
            .addRepository(getRepository<Document, DocumentEvents>({ entityName: 'document', reducer: dReducer })).create();
          await docuService.listen({ port: dPort }).then(({ url }) => console.log(`🚀  ${process.env.ORGNAME} unit test`, 'document available at', url));
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
            .addRepository(getPrivateDataRepo<LoanDetails, LoanDetailsEvents>({ entityName: 'loanDetails', reducer: tReducer })).create();
          await dtlsService.listen({ port: tPort }).then(({ url }) => console.log(`🚀  ${process.env.ORGNAME} unit test`, 'loan-details available at', url));
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
            .addRepository(getPrivateDataRepo<DocContents, DocContentsEvents>({ entityName: 'docContents', reducer: cReducer })).create();
          await ctntService.listen({ port: cPort }).then(({ url }) => console.log(`🚀  ${process.env.ORGNAME} unit test`, 'doc-contents available at', url));
        });

        // Start federated gateway
        gateway = await createGateway({
          serviceList: [
            { name: 'admin',       url: ADMIN_SERVICE },
            { name: 'loan',        url: `http://localhost:${lPort}/graphql` },
            { name: 'document',    url: `http://localhost:${dPort}/graphql` },
            { name: 'loanDetails', url: `http://localhost:${tPort}/graphql` },
            { name: 'docContents', url: `http://localhost:${cPort}/graphql` },
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

  return new Promise(done => setTimeout(() => {
    console.log('Test stopped');
    done();
  }, 500));
});

describe('Unit Test: Org1', () => {
  it('apply loan', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'ApplyLoan',
          query: APPLY_LOAN.loc.source.body,
          variables: {
            userId: '',
            loanId,
            description: `Org1 unit test loan ${loanId}`,
            reference: `REF-${loanId}`
          }
        }).expect(({ body: { data, errors } }) => expect(data.applyLoan.id).toEqual(loanId))
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
            userId: '',
            loanId,
            registration: `BR${loanId}`, companyName: 'Unit Test and Co. Ltd.',
            contactName: 'Jerk', contactPhone: '555-1234-5678', contactEmail: 'jerk@fake.it',
            startDate: '1574846420902',
            tenor: 59,
            currency: 'HKD',
            requestedAmt: 43.9,
            comment: `Org1 unit test loan-details ${loanId}`
          }
        }).expect(({ body: { data, errors } }) => {
          console.log('Loan Details', data, errors);
          expect(data.createLoanDetails.id).toEqual(loanId);
        }).catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('create document', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .set('authorization', `bearer ${accessToken}`)
        .send({
          operationName: 'CreateDocument',
          query: CREATE_DOCUMENT.loc.source.body,
          variables: {
            userId: '',
            documentId,
            loanId,
            title: `Org1 unit test document ${documentId}`,
            reference: `REF-${documentId}`
          }
        }).expect(({ body: { data, errors } }) => expect(data.createDocument.id).toEqual(documentId))
          .catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });

  it('query loan by ID', async () => {
    if (isReady) {
      await request(gateway)
        .post('/graphql')
        .send({
          operationName: 'GetLoanById',
          query: GET_LOAN_BY_ID,
          variables: { loanId }
        }).expect(({ body: { data, errors } }) => {
          console.log('Need snapshot!', JSON.stringify(data));
          expect(data.getLoanById.loanId).toEqual(loanId);
        }).catch(_ => expect(false).toBeTruthy());
      return;
    }
    expect(false).toBeTruthy();
  });
});
