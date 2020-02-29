import { buildFederatedSchema } from '@apollo/federation';
import { DataSrc } from '@espresso/gw-node';
import { ApolloServer } from 'apollo-server';
import { createTestClient } from 'apollo-server-testing';
import { APPLY_LOAN, GET_BY_ID, loanResolvers, loanTypeDefs } from '../loan';
import { loanRepo } from './__utils__';

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
      console.log('🚀  Test finished');
      done();
    }, 500)
  ));

describe('Unit Test: Loans', () => {
  it('apply loan 1', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId: 'unitTestUser',
        loanId: 'L0001',
        description: 'Org1 unit test loan 1',
        reference: 'REF-UNIT-TEST-LOAN-0',
        comment: 'Hello!!!'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0001'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('apply loan 2', async () =>
    createTestClient(service).mutate({
      mutation: APPLY_LOAN,
      variables: {
        userId: 'unitTestUser',
        loanId: 'L0002',
        description: 'Org1 unit test loan 2',
        reference: 'REF-UNIT-TEST-LOAN-1'
      }})
    .then(({ data }) => expect(data.applyLoan.id).toEqual('L0002'))
    .catch(_ => expect(false).toBeTruthy())
  );

  it('query loan 1 by id', async () =>
    createTestClient(service).query({
      query: GET_BY_ID,
      variables: { loanId: 'L0001' }
    })
    .then(({ data }) =>
      expect(
        data.getLoanById.loanId === 'L0001' &&
        data.getLoanById.reference === 'REF-UNIT-TEST-LOAN-0' &&
        data.getLoanById.description === 'Org1 unit test loan 1' &&
        data.getLoanById.comment === 'Hello!!!'
      ).toBeTruthy())
    .catch(_ => expect(false).toBeTruthy())
  );
});
