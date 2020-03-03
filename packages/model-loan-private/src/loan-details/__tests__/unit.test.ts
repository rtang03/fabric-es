import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getPrivatedataMockRepository, getReducer, PrivatedataRepository } from '@espresso/fabric-cqrs';
import { DataSrc } from '@espresso/gw-node';
// import { APPLY_LOAN, Loan, loanResolvers, loanTypeDefs, LoanEvents, loanReducer } from '@espresso/model-loan';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import {
  CREATE_LOAN_DETAILS, GET_DETAILS_BY_ID,
  LoanDetails, LoanDetailsEvents, loanDetailsReducer, loanDetailsResolvers, loanDetailsTypeDefs,
  UPDATE_LOAN_DETAILS
} from '..';

const userId = 'unitTestUser';
// const loanId = 'L1234';
const mockdb: Record<string, Commit> = {};
// const loanRepo = getMockRepository<Loan, LoanEvents>(mockdb, 'loan', getReducer<Loan, LoanEvents>(loanReducer));
const loanDetailsRepo: PrivatedataRepository = getPrivatedataMockRepository<LoanDetails, LoanDetailsEvents>(
  mockdb, 'loanDetails', getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer)
);

let service;

beforeAll(async () => {
  // const server = new ApolloServer({
  //   schema: buildFederatedSchema([{ typeDefs: loanTypeDefs, resolvers: loanResolvers }]),
  //   dataSources: () => ({
  //     loan: new DataSrc({ repo: loanRepo })
  //   }),
  //   context: () => ({ enrollmentId: 'admin' })
  // });

  // await createTestClient(server).mutate({
  //   mutation: APPLY_LOAN,
  //   variables: {
  //     userId, loanId,
  //     description: 'Unit test loan 1234',
  //     reference: 'REF-UNIT-TEST-LOAN-X',
  //     comment: 'Hello 1234'
  //   }});

  service = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs: loanDetailsTypeDefs, resolvers: loanDetailsResolvers }]),
    dataSources: () => ({
      loanDetails: new DataSrc({ repo: loanDetailsRepo })
    }),
    context: () => ({ enrollmentId: 'admin' })
  });
});

afterAll(async () =>
  new Promise(done =>
    setTimeout(() => {
      console.log('Loan Unit Test - Resolver Finished');
      done();
    }, 500)
));

describe('LoanDetails Unit Test - Resolver', () => {
  it('create loanDetails 1', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0001',
        registration: 'REG-0001',
        companyName: 'Loan Requester 1',
        contactName: 'Contact 1',
        contactPhone: '555-0001',
        contactEmail: 'c0001@fake.it',
        loanType: 'Post-Shipment',
        startDate: '1542385275431',
        tenor: 76,
        currency: 'HKD',
        requestedAmt: 50000
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0001'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 2', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0002', registration: 'REG-0002', companyName: 'Loan Requester 2',
        contactName: 'Contact 2', contactPhone: '555-0002', contactEmail: 'c0002@fake.it',
        loanType: 'Post-Shipment', startDate: '1542385275432',
        tenor: 76, currency: 'WON', requestedAmt: 50000, comment: 'Yello 0002'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0002'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 3', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0003', registration: 'REG-0003', companyName: 'Loan Requester 3',
        contactName: 'Contact 3', contactPhone: '555-0003', contactEmail: 'c0003@fake.it',
        loanType: 'Post-Shipment', startDate: '1542385275433',
        tenor: 76, currency: 'HKD', requestedAmt: 50000, comment: 'Yello 0003'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0003'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update loanDetails 2', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0002',
        currency: 'HKD', comment: 'Hello 0002'
      }})
    .then(({ data }) => expect(data.updateLoanDetails.map(d => (d && d.id) ? d.id : '')).toContain('L0002'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update an non-existing loanDetails', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L9999', comment: 'Hello 9999'
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('LOAN_DETAILS_NOT_FOUND') ? cur.message : acc, '')).toContain('LOAN_DETAILS_NOT_FOUND'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it ('update loanDetails 1 with empty currency', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0001', currency: ''
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update loanDetails 3 with both successful and fail cases', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0003', startDate: '1542385275430', currency: '', comment: 'Hello 0003'
      }})
    .then(data => {
      console.log('MOMO', JSON.stringify(data));
      return data;
    })
    .then(({ data, errors }) => {
      const errs = errors.map(e => e.message);
      expect(errs).toContain('Error: INVALID_OPERATION');
      expect(errs).toContain('Error: REQUIRED_DATA_MISSING');
      expect(data.updateLoanDetails.map(d => (d && d.id) ? d.id : '')).toContain('L0003');
    })
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loanDetails 1 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0001' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loanDetails 2 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0002' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loanDetails 3 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0003' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );
});