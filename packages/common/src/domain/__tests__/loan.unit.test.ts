import { loanCommandHandler, LoanErrors, LoanStatus } from '../loan';
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
    userId, payload: { loanId: 'LOAN000', reference: 'REFN000', loanProductId: 'PROD001', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOAN001', reference: 'REFN001', loanProductId: 'PROD001', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOAN002', reference: 'REFN002', loanProductId: 'PROD002', description: 'YOHOWAREYOU', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOAN003', reference: 'REFN003', loanProductId: 'PROD003', description: 'YOIMFINETHX', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOAN004', reference: 'REFN004', loanProductId: 'PROD004', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOAN005', reference: 'REFN005', loanProductId: 'PROD001', description: 'GOODTOHEAR!', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOAN006', reference: 'REFN006', loanProductId: 'PROD002', timestamp: Date.now() }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId, payload: { loanId: 'LOAN008', reference: 'REFN008', loanProductId: 'PROD003', timestamp: Date.now() }
  });
});

describe('Loan CommandHandler test', () => {
  it('creating a new loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
      userId,
      payload: {
        loanId: 'LOAN007',
        reference: 'REFN007',
        loanProductId: 'PROD007',
        timestamp: 1566984733093
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN007' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD007') &&
          (currentState.status === LoanStatus.applied) &&
          (currentState.timestamp === 1566984733093)
        ).toBeTruthy()
      );
  });

  it('creating a loan without loan product', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
      userId,
      payload: {
        loanId: 'LOAN099',
        reference: 'REFN099',
        loanProductId: null,
        timestamp: Date.now()
      }
    }).catch(error =>
      expect(error).toEqual(LoanErrors.requiredDataMissing)
    );
  });

  it('cancel a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).CancelLoan({
      userId,
      payload: {
        loanId: 'LOAN000',
        timestamp: Date.now()
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN000' })
      .then(({ currentState }) => {
        expect(
          (currentState.loanProductId === 'PROD001') &&
          (currentState.status === LoanStatus.cancelled)
        ).toBeTruthy();
      });
  });

  it('reject a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).RejectLoan({
      userId,
      payload: {
        loanId: 'LOAN001',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOAN001' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD001') &&
          (currentState.status === LoanStatus.rejected)
        ).toBeTruthy());
  });

  it('approve a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApproveLoan({
      userId,
      payload: {
        loanId: 'LOAN002',
        timestamp: Date.now()
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN002' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD002') &&
          (currentState.description === 'YOHOWAREYOU') &&
          (currentState.status === LoanStatus.approved)
        ).toBeTruthy());
  });

  it('return a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ReturnLoan({
      userId,
      payload: {
        loanId: 'LOAN003',
        timestamp: Date.now()
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN003' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD003') &&
          (currentState.status === LoanStatus.returned)
        ).toBeTruthy());
  });

  it('expire a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ExpireLoan({
      userId,
      payload: {
        loanId: 'LOAN004',
        timestamp: Date.now()
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN004' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD004') &&
          (currentState.status === LoanStatus.expired)
        ).toBeTruthy());
  });

  it('update description of a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).DefineLoanDescription({
      userId,
      payload: {
        loanId: 'LOAN005',
        description: 'HOWAREYOU?',
        timestamp: Date.now()
      }
    });
    return loanRepo
      .getById({ enrollmentId, id: 'LOAN005' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD001') &&
          (currentState.description === 'HOWAREYOU?')
        ).toBeTruthy());
  });

  it('add description to a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).DefineLoanDescription({
      userId,
      payload: {
        loanId: 'LOAN006',
        description: 'BUGGYSW',
        timestamp: Date.now()
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN006' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD002') &&
          (currentState.description === 'BUGGYSW')
        ).toBeTruthy());
  });

  it('update loan product of a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).UpdateLoanProduct({
      userId,
      payload: {
        loanId: 'LOAN007',
        loanProductId: 'XXXXXXX',
        timestamp: Date.now()
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN007' })
      .then(({ currentState }) =>
        expect(currentState.loanProductId === 'XXXXXXX').toBeTruthy());
  });

  it('creating a loan without loan reference', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
      userId,
      payload: {
        loanId: 'LOAN099',
        reference: null,
        loanProductId: 'PROD099',
        timestamp: Date.now()
      }
    }).catch(error =>
      expect(error).toEqual(LoanErrors.requiredDataMissing)
    );
  });

  it('updating loan reference after the loan is created', async () => {
    expect.assertions(1);
    return loanCommandHandler({ enrollmentId, userRepo, loanRepo }).DefineLoanReference({
      userId,
      payload: {
        loanId: 'LOAN002',
        reference: 'REFN012',
        timestamp: Date.now()
      }
    }).catch(error =>
      expect(error).toEqual(LoanErrors.invalidOperation)
    );
  });
});
