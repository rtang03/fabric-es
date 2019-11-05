import { LoanErrors, LoanStatus } from '../../domain/loan';
import { loanCommandHandler } from '../loan';
import { loanRepo, userRepo } from './__utils__';

const enrollmentId = '';

beforeAll(async () => {
  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId: 'USER001', payload: { loanId: 'LOAN000', loanProductId: 'PROD001', timestamp: 1566984732743 }
  });
  const s0 = await loanRepo.getById({ enrollmentId, id: 'LOAN000' }).then(({ currentState }) => {
    console.log('LOAN000', currentState);
    return currentState.status;
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId: 'USER001', payload: { loanId: 'LOAN001', loanProductId: 'PROD001', timestamp: 1566984732743 }
  });
  const s1 = await loanRepo.getById({ enrollmentId, id: 'LOAN001' }).then(({ currentState }) => {
    console.log('LOAN001', currentState);
    process.nextTick(() => setTimeout(() => true, 0));
    return currentState.status;
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId: 'USER001', payload: { loanId: 'LOAN002', loanProductId: 'PROD002', description: 'YOHOWAREYOU', timestamp: 1566984732843 }
  });
  const s2 = await loanRepo.getById({ enrollmentId, id: 'LOAN002' }).then(({ currentState }) => {
    console.log('LOAN002', currentState);
    return currentState.status;
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId: 'USER001', payload: { loanId: 'LOAN003', loanProductId: 'PROD003', description: 'YOIMFINETHX', timestamp: 1566984732853 }
  });
  const s3 = await loanRepo.getById({ enrollmentId, id: 'LOAN003' }).then(({ currentState }) => {
    console.log('LOAN003', currentState.status);
    return currentState.status;
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId: 'USER001', payload: { loanId: 'LOAN004', loanProductId: 'PROD004', timestamp: 1566984732863 }
  });
  const s4 = await loanRepo.getById({ enrollmentId, id: 'LOAN004' }).then(({ currentState }) => {
    console.log('LOAN004', currentState.status);
    return currentState.status;
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId: 'USER001', payload: { loanId: 'LOAN005', loanProductId: 'PROD001', description: 'GOODTOHEAR!', timestamp: 1566984732873 }
  });
  const s5 = await loanRepo.getById({ enrollmentId, id: 'LOAN005' }).then(({ currentState }) => {
    console.log('LOAN005', currentState.status);
    if ((currentState.status >= 0) && (currentState.ownerId === 'USER001') && (currentState.loanId === 'LOAN005') && (currentState.timestamp > 0) && currentState.loanProductId && currentState.description) {
      return currentState;
    } else {
      return -1;
    }
  });

  await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
    userId: 'USER001', payload: { loanId: 'LOAN006', loanProductId: 'PROD002', timestamp: 1566984732883 }
  });
  const s6 = await loanRepo.getById({ enrollmentId, id: 'LOAN006' }).then(({ currentState }) => {
    console.log('LOAN006', currentState);
    return currentState.status;
  });
});

describe('Loan CommandHandler test', () => {
  it('creating a new loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ApplyLoan({
      userId: 'USER001',
      payload: {
        loanId: 'LOAN007',
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
      userId: 'USER001',
      payload: {
        loanId: 'LOAN099',
        loanProductId: null,
        timestamp: 1566984733193
      }
    }).catch(error =>
      expect(error).toEqual(LoanErrors.requiredDataMissing)
    );
  });

  it('cancel a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).CancelLoan({
      userId: 'USER001',
      payload: {
        loanId: 'LOAN000',
        timestamp: 1566984733293
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN000' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD001') &&
          (currentState.status === LoanStatus.cancelled)
        ).toBeTruthy());
  });

  it('reject a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).RejectLoan({
      userId: 'USER001',
      payload: {
        loanId: 'LOAN001',
        timestamp: 1566984733493
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
      userId: 'USER001',
      payload: {
        loanId: 'LOAN002',
        timestamp: 1566984733593
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN002' })
      .then(({ currentState }) =>
        expect(
          (currentState.loanProductId === 'PROD002') &&
          (currentState.status === LoanStatus.approved)
        ).toBeTruthy());
  });

  it('return a loan', async () => {
    await loanCommandHandler({ enrollmentId, userRepo, loanRepo }).ReturnLoan({
      userId: 'USER001',
      payload: {
        loanId: 'LOAN003',
        timestamp: 1566984733693
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
      userId: 'USER001',
      payload: {
        loanId: 'LOAN004',
        timestamp: 1566984733793
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
      userId: 'USER001',
      payload: {
        loanId: 'LOAN005',
        description: 'HOWAREYOU?',
        timestamp: 1566984733893
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
      userId: 'USER001',
      payload: {
        loanId: 'LOAN006',
        description: 'BUGGYSW',
        timestamp: 1566984733993
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
      userId: 'USER001',
      payload: {
        loanId: 'LOAN007',
        loanProductId: 'XXXXXXX',
        timestamp: 1566984734093
      }
    });
    return await loanRepo
      .getById({ enrollmentId, id: 'LOAN007' })
      .then(({ currentState }) =>
        expect(currentState.loanProductId === 'XXXXXXX').toBeTruthy());
  });
});