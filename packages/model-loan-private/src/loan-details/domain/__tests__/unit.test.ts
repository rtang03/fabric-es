import { Commit, getPrivatedataMockRepository, getReducer, PrivatedataRepository } from '@espresso/fabric-cqrs';
import { LoanDetails, LoanDetailsEvents, loanDetailsReducer, loanDetailsCommandHandler } from '../../../loan-details';

const enrollmentId = '';
const userId = 'USER001';
const mockdb: Record<string, Commit> = {};
const loanDetailsRepo: PrivatedataRepository = getPrivatedataMockRepository<LoanDetails, LoanDetailsEvents>(
  mockdb, 'loanDetails', getReducer<LoanDetails, LoanDetailsEvents>(loanDetailsReducer)
);

describe('LoanDetails tests', () => {
  it('create and query loan-details', async () => {
    await loanDetailsCommandHandler({ enrollmentId, loanDetailsRepo }).CreateLoanDetails({
      userId,
      payload: {
        loanId: 'LOANID011',
        requester: { registration: 'LEI0001', name: 'Johnson International' },
        contact: { name: 'John JOhnson', phone: '555-12333', email: 'johnson@fake.it' },
        loanType: 'Post-shipment',
        startDate: 1542385275431,
        tenor: 76,
        currency: 'HKD',
        requestedAmt: 50000,
        timestamp: 1542385175431
      }
    });
    return loanDetailsRepo
      .getById({ enrollmentId, id: 'LOANID011' })
      .then(({ currentState }) => expect(currentState === 'LOANID011' && currentState.requestedAmt === 50000));
  });
});
