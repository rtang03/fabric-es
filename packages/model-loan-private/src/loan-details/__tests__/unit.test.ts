import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getPrivatedataMockRepository, getReducer, PrivatedataRepository } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import {
  CREATE_LOAN_DETAILS, GET_DETAILS_BY_ID,
  LoanDetails, LoanDetailsEvents, loanDetailsReducer, loanDetailsResolvers, loanDetailsTypeDefs,
  UPDATE_LOAN_DETAILS
} from '..';

const userId = 'unitTestUser';
const mockdb: Record<string, Commit> = {};
const loanDetailsRepo: PrivatedataRepository = getPrivatedataMockRepository<LoanDetails, LoanDetailsEvents>(
  mockdb, 'loanDetails', getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer)
);

let service;

beforeAll(async () => {
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
  it('create loanDetails 0', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0000',
        requester: {
          registration: 'REG-0000',
          name: 'Loan Requester 0'
        },
        contact: {
          name: 'Contact 0',
          phone: '555-0000',
          email: 'c0000@fake.it'
        },
        loanType: 'Post-Shipment',
        startDate: '1542385275430',
        tenor: 70,
        currency: 'HKD',
        requestedAmt: 50000
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0000'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 1', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0001',
        requester: {
          registration: 'REG-0001', name: 'Loan Requester 1'
        }, contact: {
          name: 'Contact 1', phone: '555-0001', email: 'c0001@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275431',
        tenor: 71, currency: 'HKD', requestedAmt: 50000
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0001'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 2', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0002',
        requester: {
          registration: 'REG-0002', name: 'Loan Requester 2'
        }, contact: {
          name: 'Contact 2', phone: '555-0002', email: 'c0002@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275432',
        tenor: 72, currency: 'HKD', requestedAmt: 50000, comment: 'Hello 0002'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0002'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 3', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0003',
        requester: {
          registration: 'REG-0003', name: 'Loan Requester 3'
        }, contact: {
          name: 'Contact 3', phone: '555-0003', email: 'c0003@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275433',
        tenor: 73, currency: 'HKD', requestedAmt: 50000, comment: 'Hello 0003'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0003'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 4', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0004',
        requester: {
          registration: 'REG-0004', name: 'Loan Requester 4'
        }, contact: {
          name: 'Contact 4', phone: '555-0004', email: 'c0004@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275434',
        tenor: 74, currency: 'HKD', requestedAmt: 50000, comment: 'Hello 0004'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0004'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 5', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0005',
        requester: {
          registration: 'REG-0005', name: 'Loan Requester 5'
        }, contact: {
          name: 'Contact 5', phone: '555-0005', email: 'c0005@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275435',
        tenor: 75, currency: 'HKD', requestedAmt: 50000, comment: 'Hello 0005'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0005'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 6', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0006',
        requester: {
          registration: 'REG-0006', name: 'Loan Requester 6'
        }, contact: {
          name: 'Contact 6', phone: '555-0006', email: 'c0006@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275436',
        tenor: 76, currency: 'HKD', requestedAmt: 50000, comment: 'Hello 0006'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0006'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 7', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0007',
        requester: {
          registration: 'REG-0007', name: 'Loan Requester 7', type: 'Da Yee Lung'
        }, contact: {
          name: 'Contact 7', phone: '555-0007', email: 'c0007@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275437',
        tenor: 77, currency: 'HKD', requestedAmt: 50000, comment: 'Hello 0007'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0007'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails 8', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0008',
        requester: {
          registration: 'REG-0008', name: 'Loan Requester 8', type: 'Da Yee Lung'
        }, contact: {
          salutation: 'Dr', name: 'Contact 8', phone: '555-0008', email: 'c0008@fake.it', title: 'Clerk'
        }, loanType: 'No Shipment', startDate: '1542385275438',
        tenor: 78, currency: 'HKD', requestedAmt: 50000, approvedAmt: 49999, comment: 'Hello 0008'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0008'))
    .catch(_ => expect(false).toBeTruthy())
  );

  // TODO: Implement lifecycle event attribute to prevent creating same entity more than once
  // NOTE: This 'create loanDetails' call should return normal, but querying 'L0000' should return the original result instead of the changed values
  it('create loanDetails 0 again', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0000',
        requester: {
          registration: 'REG-0000VERWRITTEN', name: 'Loan Requester 0VERWRITTEN'
        }, contact: {
          name: 'Contact 0VERWRITTEN', phone: '555-0000', email: 'c0000@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275430',
        tenor: 76, currency: 'HKD', requestedAmt: 50000, comment: 'Hello 0000VERWRITTEN'
      }})
    .then(({ data }) => expect(data.createLoanDetails.id).toEqual('L0000'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails with empty currency', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L9999',
        requester: {
          registration: 'REG-9999', name: 'Loan Requester 9'
        }, contact: {
          name: 'Contact 9', phone: '555-9999', email: 'c9999@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275439',
        tenor: 79, currency: '', requestedAmt: 50000, comment: 'Hello 9999'
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails with empty contact phone', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L9999',
        requester: {
          registration: 'REG-9999', name: 'Loan Requester 9'
        }, contact: {
          name: 'Contact 9', phone: '', email: 'c9999@fake.it'
        }, loanType: 'Post-Shipment', startDate: '1542385275439',
        tenor: 79, currency: 'HKD', requestedAmt: 50000, comment: 'Hello 9999'
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails with missing contact', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L9999',
        requester: {
          registration: 'REG-9999', name: 'Loan Requester 9'
        }, loanType: 'Post-Shipment', startDate: '1542385275439',
        tenor: 79, currency: '', requestedAmt: 50000, comment: 'Hello 9999'
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('was not provided') ? cur.message : acc, '')).toContain('was not provided'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create loanDetails with empty contact', async () =>
    createTestClient(service).mutate({
      mutation: CREATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L9999',
        requester: {
          registration: 'REG-9999', name: 'Loan Requester 9'
        }, contact: {}, loanType: 'Post-Shipment', startDate: '1542385275439',
        tenor: 79, currency: '', requestedAmt: 50000, comment: 'Hello 9999'
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update loanDetails 2', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0002',
        currency: 'USD', comment: 'Hello 0002 EDITED'
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
        userId, loanId: 'L0003', startDate: '1542385275430', currency: '', comment: 'Hello 0003 EDITED'
      }})
    .then(({ data, errors }) => {
      const errs = errors.map(e => e.message);
      expect(errs).toContain('Error: INVALID_OPERATION');
      expect(errs).toContain('Error: REQUIRED_DATA_MISSING');
      expect(data.updateLoanDetails.map(d => (d && d.id) ? d.id : '')).toContain('L0003');
    })
    .catch(_ => expect(false).toBeTruthy())
  );

  it ('update readonly field of loanDetails 4', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0004', requester: { type: 'Da Yee Lung' }
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('INVALID_OPERATION') ? cur.message : acc, '')).toContain('INVALID_OPERATION'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it ('remove mandatory field from loanDetails 5', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0005', contact: { phone: '' }
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it ('update loanDetails 6', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0006', contact: { name: 'Contact 6 EDITED' }, comment: 'Hello 0006 EDITED'
      }})
    .then(({ data }) => expect(data.updateLoanDetails.map(d => (d && d.id) ? d.id : '')).toContain('L0006'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it ('update loanDetails 7', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0007', contact: { name: 'Contact 7 EDITED', phone: '555-9997' }, comment: 'Hello 0007 EDITED'
      }})
    .then(({ data }) => expect(data.updateLoanDetails.map(d => (d && d.id) ? d.id : '')).toContain('L0007'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it ('update loanDetails 8', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN_DETAILS,
      variables: {
        userId, loanId: 'L0008', contact: { name: 'Contact 8 EDITED', phone: '555-9998' },
        comment: 'Hello 0008 EDITED', loanType: 'Pre-Shipment', requestedAmt: 50001, approvedAmt: 49998
      }})
    .then(({ data }) => expect(data.updateLoanDetails.map(d => (d && d.id) ? d.id : '')).toContain('L0008'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loanDetails 0 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0000' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
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

  it('query loanDetails 4 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0004' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loanDetails 5 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0005' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loanDetails 6 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0006' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loanDetails 7 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0007' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loanDetails 8 by id', async () =>
    createTestClient(service).query({
      query: GET_DETAILS_BY_ID,
      variables: { loanId: 'L0008' }
    })
    .then(({ data }) => expect(data.getLoanDetailsById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );
});
