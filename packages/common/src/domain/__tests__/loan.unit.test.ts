import { Errors } from '../';
import { loanCommandHandler, LoanStatus } from '../loan';
import { userCommandHandler } from '../user';
import { loanRepo, userRepo } from './__utils__';

const enrollmentId = '';
const userId = 'USER001';

beforeAll(async () => {
  await userCommandHandler({ enrollmentId, userRepo }).CreateUser({
    userId,
    payload: { name: 'Zero Zero One', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID000', reference: 'LOANREF000', loaner: 'BANK001', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID001', reference: 'LOANREF001', loaner: 'BANK001', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID002', reference: 'LOANREF002', loaner: 'BANK002', description: 'YOHOWAREYOU', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID003', reference: 'LOANREF003', loaner: 'BANK003', description: 'YOIMFINETHX', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID004', reference: 'LOANREF004', loaner: 'BANK004', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID005', reference: 'LOANREF005', loaner: 'BANK001', description: 'GOODTOHEAR!', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID006', reference: 'LOANREF006', loaner: 'BANK002', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOANID008', reference: 'LOANREF008', loaner: 'BANK003', timestamp: Date.now() }
  });
});

describe('Loan CommandHandler test', () => {
  it('creating a new loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
      userId,
      payload: {
        loanId: 'LOANID007',
        reference: 'LOANREF007',
        loaner: 'BANK007',
        timestamp: 1566984733093
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID007' })
      .then(({ currentState }) =>
        expect(
          (currentState.loaner === 'BANK007') &&
          (currentState.status === LoanStatus.LoanApplied) &&
          (currentState.timestamp === 1566984733093)
        ).toBeTruthy()
      );
  });

  it('creating a loan without loaner', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
      userId,
      payload: {
        loanId: 'LOAN099',
        reference: 'REFN099',
        loaner: null,
        timestamp: Date.now()
      }
    }).catch(error =>
      expect(error).toEqual(Errors.requiredDataMissing)
    );
  });

  it('cancel a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).CancelLoan({
      userId,
      payload: {
        loanId: 'LOANID000',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID000' })
      .then(({ currentState }) => {
        expect(
          (currentState.loaner === 'BANK001') &&
          (currentState.status === LoanStatus.LoanCancelled)
        ).toBeTruthy();
      });
  });

  it('reject a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).RejectLoan({
      userId,
      payload: {
        loanId: 'LOANID001',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID001' })
      .then(({ currentState }) =>
        expect(
          (currentState.loaner === 'BANK001') &&
          (currentState.status === LoanStatus.LoanRejected)
        ).toBeTruthy());
  });

  it('approve a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApproveLoan({
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
          (currentState.loaner === 'BANK002') &&
          (currentState.description === 'YOHOWAREYOU') &&
          (currentState.status === LoanStatus.LoanApproved)
        ).toBeTruthy());
  });

  it('return a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ReturnLoan({
      userId,
      payload: {
        loanId: 'LOANID003',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID003' })
      .then(({ currentState }) =>
        expect(
          (currentState.loaner === 'BANK003') &&
          (currentState.status === LoanStatus.LoanReturned)
        ).toBeTruthy());
  });

  it('expire a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ExpireLoan({
      userId,
      payload: {
        loanId: 'LOANID004',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID004' })
      .then(({ currentState }) =>
        expect(
          (currentState.loaner === 'BANK004') &&
          (currentState.status === LoanStatus.LoanExpired)
        ).toBeTruthy());
  });

  it('update description of a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).DefineLoanDescription({
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
        expect(
          (currentState.loaner === 'BANK001') &&
          (currentState.description === 'HOWAREYOU?')
        ).toBeTruthy());
  });

  it('add description to a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).DefineLoanDescription({
      userId,
      payload: {
        loanId: 'LOANID006',
        description: 'BUGGYSW',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID006' })
      .then(({ currentState }) =>
        expect(
          (currentState.loaner === 'BANK002') &&
          (currentState.description === 'BUGGYSW')
        ).toBeTruthy());
  });

  it('update loaner of a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).UpdateLoaner({
      userId,
      payload: {
        loanId: 'LOANID007',
        loaner: 'XXXXXXX',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOANID007' })
      .then(({ currentState }) =>
        expect(currentState.loaner === 'XXXXXXX').toBeTruthy());
  });

  it('creating a loan without loan reference', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
      userId,
      payload: {
        loanId: 'LOAN099',
        reference: null,
        loaner: 'PROD099',
        timestamp: Date.now()
      }
    }).catch(error =>
      expect(error).toEqual(Errors.requiredDataMissing)
    );
  });

  it('updating loan reference after the loan is created', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, userRepo, loanRepo }).DefineLoanReference({
      userId,
      payload: {
        loanId: 'LOANID002',
        reference: 'LOANREF012',
        timestamp: Date.now()
      }
    }).catch(error =>
      expect(error).toEqual(Errors.invalidOperation)
    );
  });
});
