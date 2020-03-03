import { Commit, getMockRepository, getReducer } from '@espresso/fabric-cqrs';
import { Loan, loanCommandHandler, LoanEvents, loanReducer, LoanStatus } from '../..';

const enrollmentId = '';
const userId = 'USER001';
const mockdb: Record<string, Commit> = {};
export const loanRepo = getMockRepository<Loan, LoanEvents>(mockdb, 'loan', getReducer<Loan, LoanEvents>(loanReducer));

beforeAll(async () => {
  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID000', reference: 'LOANREF000', description: 'Loan 0', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID001', reference: 'LOANREF001', description: 'Loan 1', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID002', reference: 'LOANREF002', description: 'YOHOWAREYOU', comment: 'Hello', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID003', reference: 'LOANREF003', description: 'YOIMFINETHX', comment: 'How are you?', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID004', reference: 'LOANREF004', description: 'Loan 0', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID005', reference: 'LOANREF005', description: 'GOODTOHEAR!', comment: 'Gutten Tag', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID006', reference: 'LOANREF006', description: 'Loan 6', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
    userId,
    payload: { loanId: 'LOANID008', reference: 'LOANREF008', description: 'Loan 8', timestamp: Date.now() }
  });
});

describe('Loan Unit Test - CommandHandler', () => {
  it('creating a new loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).ApplyLoan({
      userId,
      payload: {
        loanId: 'LOANID007',
        reference: 'LOANREF007',
        description: 'Loan 7',
        timestamp: 1566984733093
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID007' })
      .then(({ currentState }) =>
        expect(currentState.status === LoanStatus.LoanApplied && currentState.timestamp === 1566984733093).toBeTruthy()
      );
  });

  it('cancel a loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).CancelLoan({
      userId,
      payload: {
        loanId: 'LOANID000',
        timestamp: Date.now()
      }
    });
    return loanRepo.getById({ enrollmentId, id: 'LOANID000' }).then(({ currentState }) => {
      expect(currentState.reference === 'LOANREF000' && currentState.status === LoanStatus.LoanCancelled).toBeTruthy();
    });
  });

  it('reject a loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).RejectLoan({
      userId,
      payload: {
        loanId: 'LOANID001',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID001' })
      .then(({ currentState }) =>
        expect(currentState.reference === 'LOANREF001' && currentState.status === LoanStatus.LoanRejected).toBeTruthy()
      );
  });

  it('approve a loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).ApproveLoan({
      userId,
      payload: {
        loanId: 'LOANID002',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID002' })
      .then(({ currentState }) =>
        expect(
          currentState.reference === 'LOANREF002' &&
            currentState.description === 'YOHOWAREYOU' &&
            currentState.comment === 'Hello' &&
            currentState.status === LoanStatus.LoanApproved
        ).toBeTruthy()
      );
  });

  it('return a loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).ReturnLoan({
      userId,
      payload: {
        loanId: 'LOANID003',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID003' })
      .then(({ currentState }) =>
        expect(currentState.reference === 'LOANREF003' &&
        currentState.comment === 'How are you?' &&
        currentState.status === LoanStatus.LoanReturned).toBeTruthy()
      );
  });

  it('expire a loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).ExpireLoan({
      userId,
      payload: {
        loanId: 'LOANID004',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID004' })
      .then(({ currentState }) =>
        expect(currentState.reference === 'LOANREF004' && currentState.status === LoanStatus.LoanExpired).toBeTruthy()
      );
  });

  it('update description of a loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).DefineLoanDescription({
      userId,
      payload: {
        loanId: 'LOANID005',
        description: 'HOWAREYOU?',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID005' })
      .then(({ currentState }) =>
        expect(currentState.reference === 'LOANREF005' && currentState.description === 'HOWAREYOU?').toBeTruthy()
      );
  });

  it('update comment of a loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).DefineLoanComment({
      userId,
      payload: {
        loanId: 'LOANID006',
        comment: 'HOWAREYOU?',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID006' })
      .then(({ currentState }) =>
        expect(currentState.reference === 'LOANREF006' && currentState.comment === 'HOWAREYOU?').toBeTruthy()
      );
  });

  it('update a non-existing loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo })
      .DefineLoanDescription({
        userId,
        payload: {
          loanId: '99999999999',
          description: 'HOWAREYOU?',
          timestamp: Date.now()
        }
      })
      .catch(({ message }) => expect(message).toEqual('LOAN_NOT_FOUND: id: 99999999999'));
  });

  it('add comment to a loan', async () => {
    await loanCommandHandler({ enrollmentId, loanRepo }).DefineLoanComment({
      userId,
      payload: {
        loanId: 'LOANID008',
        comment: 'BUGGYSW',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID008' })
      .then(({ currentState }) =>
        expect(currentState.reference === 'LOANREF008' && currentState.comment === 'BUGGYSW').toBeTruthy()
      );
  });

  it('creating a loan with empty loan reference', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, loanRepo })
      .ApplyLoan({
        userId,
        payload: {
          loanId: 'LOAN099',
          reference: '',
          description: 'Ha',
          timestamp: Date.now()
        }
      })
      .catch(({ message }) => expect(message).toEqual('REQUIRED_DATA_MISSING'));
  });

  it('updating loan reference after the loan is created', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, loanRepo })
      .DefineLoanReference({
        userId,
        payload: {
          loanId: 'LOANID002',
          reference: 'LOANREF012',
          timestamp: Date.now()
        }
      })
      .catch(({ message }) => expect(message).toEqual('INVALID_OPERATION'));
  });

  it('updating description with empty string', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, loanRepo }).DefineLoanDescription({
        userId,
        payload: {
          loanId: 'LOANID002',
          description: '',
          timestamp: Date.now()
        }
      }).catch(({ message }) => expect(message).toEqual('REQUIRED_DATA_MISSING'));
  });
});
