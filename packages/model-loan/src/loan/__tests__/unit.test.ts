import { buildFederatedSchema } from '@apollo/federation';
import { Commit, getMockRepository, getReducer } from '@fabric-es/fabric-cqrs';
import { DataSrc } from '@fabric-es/gateway-lib';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import gql from 'graphql-tag';
import {
  APPROVE_LOAN, APPLY_LOAN, CANCEL_LOAN, EXPIRE_LOAN,
  Loan, LoanEvents, loanReducer, loanResolvers, loanTypeDefs,
  REJECT_LOAN, RETURN_LOAN, UPDATE_LOAN
} from '..';

const GET_BY_ID = gql`
query GetLoanById($loanId: String!) {
  getLoanById(loanId: $loanId) {
    loanId
    ownerId
    description
    reference
    comment
    status
  }
}`;
const GET_LOANS_BY_PAGE = gql`
  query GetLoansByPage($pageSize: Int) {
    getPaginatedLoans(pageSize: $pageSize) {
      total
      hasMore
      entities {
        loanId
        ownerId
        description
        reference
        comment
        status
      }
    }
  }
`;

const userId = 'unitTestUser';
const mockdb: Record<string, Commit> = {};
const loanRepo = getMockRepository<Loan, LoanEvents>(mockdb, 'loan', getReducer<Loan, LoanEvents>(loanReducer));

let service;

beforeAll(async () => {
  service = new ApolloServer({
    schema: buildFederatedSchema([{ typeDefs: loanTypeDefs, resolvers: loanResolvers }]),
    dataSources: () => ({
      loan: new DataSrc({ repo: loanRepo })
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

describe('Loan Unit Test - Resolver', () => {
  it('apply loan 0', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0000',
        description: 'Unit test loan 0',
        reference: 'REF-UNIT-TEST-LOAN-0',
        comment: 'Hello 0000'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0000'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 1', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0001',
        description: 'Unit test loan 1',
        reference: 'REF-UNIT-TEST-LOAN-1',
        comment: 'Hello 0001'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0001'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 2', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0002',
        description: 'Unit test loan 2',
        reference: 'REF-UNIT-TEST-LOAN-2'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0002'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 3', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0003',
        description: 'Unit test loan 3',
        reference: 'REF-UNIT-TEST-LOAN-3',
        comment: 'Hello 0003'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0003'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 4', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0004',
        description: 'Unit test loan 4',
        reference: 'REF-UNIT-TEST-LOAN-4',
        comment: 'Hello 0004'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0004'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 5', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0005',
        description: 'Unit test loan 5',
        reference: 'REF-UNIT-TEST-LOAN-5',
        comment: 'Hello 0005'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0005'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 6', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0006',
        description: 'Unit test loan 6',
        reference: 'REF-UNIT-TEST-LOAN-6',
        comment: 'Hello 0006'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0006'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 7', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0007',
        description: 'Unit test loan 7',
        reference: 'REF-UNIT-TEST-LOAN-7',
        comment: 'Hello 0007'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0007'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 8', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0008',
        description: 'Unit test loan 8',
        reference: 'REF-UNIT-TEST-LOAN-8',
        comment: 'Hello 0008'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0008'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 9', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0009',
        description: 'Unit test loan 9',
        reference: 'REF-UNIT-TEST-LOAN-9',
        comment: 'Hello 0009'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0009'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 10', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0010',
        description: 'Unit test loan 10',
        reference: 'REF-UNIT-TEST-LOAN-A',
        comment: 'Hello 0010'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0010'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 11', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0011',
        description: 'Unit test loan 11',
        reference: 'REF-UNIT-TEST-LOAN-B',
        comment: 'Hello 0011'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0011'))
    .catch(_ => expect(false).toBeTruthy())
  );

  // TODO: Implement lifecycle event attribute to prevent creating same entity more than once
  // NOTE: This 'apply loan' call should return normal, but querying 'L0000' should return the original result instead of the changed values
  it('apply loan 0 again', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L0000',
        description: 'Unit test loan 0VERWRITTEN',
        reference: 'REF-UNIT-TEST-LOAN-0VERWRITTEN',
        comment: 'Hello 0000VERWRITTEN'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0000'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update description of loan 2', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN,
      variables: {
        userId, loanId: 'L0002',
        description: 'Unit test loan 2 EDITED'
      }})
    .then(({ data }) => expect(data.updateLoan.map(d => (d && d.id) ? d.id : '')).toContain('L0002'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update comment of loan 3', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN,
      variables: {
        userId, loanId: 'L0003',
        comment: 'Hello 0003 EDITED'
      }})
    .then(({ data }) => expect(data.updateLoan.map(d => (d && d.id) ? d.id : '')).toContain('L0003'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update description and comment of loan 4', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN,
      variables: {
        userId, loanId: 'L0004',
        description: 'Unit test loan 4 EDITED',
        comment: 'Hello 0004 EDITED'
      }})
    .then(({ data }) => expect(data.updateLoan.map(d => (d && d.id) ? d.id : '')).toContain('L0004'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('Add comment to loan 2', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN,
      variables: {
        userId, loanId: 'L0002',
        comment: 'Hello 0002 ADDED'
      }})
    .then(({ data }) => expect(data.updateLoan.map(d => (d && d.id) ? d.id : '')).toContain('L0002'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create a loan without description', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L9999',
        reference: 'REF-UNIT-TEST-LOAN-9'
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('was not provided') ? cur.message : acc, '')).toContain('was not provided'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('create a loan with empty description', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId, loanId: 'L9999',
        reference: 'REF-UNIT-TEST-LOAN-9',
        description: ''
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update an non-existing loan', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN,
      variables: {
        userId, loanId: 'L9999',
        comment: 'Hello 9999'
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('LOAN_NOT_FOUND') ? cur.message : acc, '')).toContain('LOAN_NOT_FOUND'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update loan 5 with empty description', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN,
      variables: {
        userId, loanId: 'L0005',
        description: ''
      }})
    .then(({ errors }) => expect(errors.reduce((acc, cur) =>
      cur.message.includes('REQUIRED_DATA_MISSING') ? cur.message : acc, '')).toContain('REQUIRED_DATA_MISSING'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('update loan 6 with both successful and fail cases', async () =>
    createTestClient(service).mutate({
      mutation: UPDATE_LOAN,
      variables: {
        userId, loanId: 'L0006',
        reference: 'HI',
        description: '',
        comment: 'Hello 0006 EDITED'
      }})
    .then(({ data, errors }) => {
      const errs = errors.map(e => e.message);
      expect(errs).toContain('Error: INVALID_OPERATION');
      expect(errs).toContain('Error: REQUIRED_DATA_MISSING');
      expect(data.updateLoan.map(d => (d && d.id) ? d.id : '')).toContain('L0006');
    })
    .catch(_ => expect(false).toBeTruthy())
  );

  it('cancel loan 7', async () =>
    createTestClient(service).mutate({
      mutation: CANCEL_LOAN,
      variables: { userId, loanId: 'L0007' }
    })
    .then(({ data }) => expect(data.cancelLoan.id).toEqual('L0007'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('approve loan 8', async () =>
    createTestClient(service).mutate({
      mutation: APPROVE_LOAN,
      variables: { userId, loanId: 'L0008' }
    })
    .then(({ data }) => expect(data.approveLoan.id).toEqual('L0008'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('return loan 9', async () =>
    createTestClient(service).mutate({
      mutation: RETURN_LOAN,
      variables: { userId, loanId: 'L0009' }
    })
    .then(({ data }) => expect(data.returnLoan.id).toEqual('L0009'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('reject loan 10', async () =>
    createTestClient(service).mutate({
      mutation: REJECT_LOAN,
      variables: { userId, loanId: 'L0010' }})
    .then(({ data }) => expect(data.rejectLoan.id).toEqual('L0010'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('flag loan 11 as expired', async () =>
    createTestClient(service).mutate({
      mutation: EXPIRE_LOAN,
      variables: { userId, loanId: 'L0011' }})
    .then(({ data }) => expect(data.expireLoan.id).toEqual('L0011'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loan 0 by id', async () =>
    createTestClient(service).query({
      query: GET_BY_ID,
      variables: { loanId: 'L0000' }
    })
    .then(({ data }) => expect(data.getLoanById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loan 1 by id', async () =>
    createTestClient(service).query({
      query: GET_BY_ID,
      variables: { loanId: 'L0001' }
    })
    .then(({ data }) => expect(data.getLoanById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loan 2 by id', async () =>
    createTestClient(service).query({
      query: GET_BY_ID,
      variables: { loanId: 'L0002' }
    })
    .then(({ data }) => expect(data.getLoanById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loan 3 by id', async () =>
    createTestClient(service).query({
      query: GET_BY_ID,
      variables: { loanId: 'L0003' }
    })
    .then(({ data }) => expect(data.getLoanById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loan 4 by id', async () =>
    createTestClient(service).query({
      query: GET_BY_ID,
      variables: { loanId: 'L0004' }
    })
    .then(({ data }) => expect(data.getLoanById).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loans by page', async () =>
    createTestClient(service).query({
      query: GET_LOANS_BY_PAGE
    })
    .then(({ data }) => expect(data.getPaginatedLoans).toMatchSnapshot())
    .catch(_ => expect(false).toBeTruthy())
  );
});
