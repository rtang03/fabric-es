import { LoanCommandHandler, LoanErrors, LoanRepo } from '../domain/loan';
import { UserRepo } from '../domain/types';

export const loanCommandHandler: (
  option: {
    enrollmentId: string;
    userRepo: UserRepo;
    loanRepo: LoanRepo;
  }
) => LoanCommandHandler = ({
  enrollmentId, userRepo, loanRepo
}) => ({
  ApplyLoan: async ({
    userId,
    payload: { loanId, description, loanProductId, timestamp }
  }) => {
    if (!loanProductId) {
      throw LoanErrors.requiredDataMissing;
    }
    const events: any = [
      { type: 'applied', payload: { loanId, userId, timestamp }},
      { type: 'LoanProductDefined', payload: { loanId, userId, loanProductId, timestamp }}
    ];
    if (describe) {
      events.push({ type: 'LoanDescriptionDefined', payload: { loanId, userId, description, timestamp }});
    }
    return loanRepo
      .create({ enrollmentId, id: loanId })
      .save(events);
  },
  CancelLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) =>
    loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) {
          throw LoanErrors.loanNotFound(loanId);
        }
        return save([{
          type: 'cancelled',
          payload: { loanId, userId, timestamp }
        }]);
      }),
  ApproveLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) =>
    loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) {
          throw LoanErrors.loanNotFound(loanId);
        }
        return save([{
          type: 'approved',
          payload: { loanId, userId, timestamp }
        }]);
      }),
  ReturnLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) =>
    loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) {
          throw LoanErrors.loanNotFound(loanId);
        }
        return save([{
          type: 'returned',
          payload: { loanId, userId, timestamp }
        }]);
      }),
  RejectLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) =>
    loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) {
          throw LoanErrors.loanNotFound(loanId);
        }
        return save([{
          type: 'rejected',
          payload: { loanId, userId, timestamp }
        }]);
      }),
  ExpireLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) =>
    loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) {
          throw LoanErrors.loanNotFound(loanId);
        }
        return save([{
          type: 'expired',
          payload: { loanId, userId, timestamp }
        }]);
      }),
  DefineLoanDescription: async ({
    userId,
    payload: { loanId, description, timestamp }
  }) =>
    loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) {
          throw LoanErrors.loanNotFound(loanId);
        }
        return save([{
          type: 'LoanDescriptionDefined',
          payload: { loanId, userId, description, timestamp }
        }]);
      }),
  UpdateLoanProduct: async ({
    userId,
    payload: { loanId, loanProductId, timestamp }
  }) =>
    loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) {
          throw LoanErrors.loanNotFound(loanId);
        }
        return save([{
          type: 'LoanProductDefined',
          payload: { loanId, userId, loanProductId, timestamp }
        }]);
      })
});
