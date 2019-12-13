import { Errors } from '@espresso/model-common';
import { LoanCommandHandler, LoanRepo } from '.';

export const LoanErrors = {
  loanNotFound: (loanId) => new Error(`LOAN_NOT_FOUND: id: ${loanId}`),
  loanCancelled: () => new Error('LOAN_CANCELLED'),
  loanApproved: () => new Error('LOAN_APPROVED'),
  loanReturned: () => new Error('LOAN_RETURNED'),
  loanRejected: () => new Error('LOAN_REJECTED'),
  loanExpired: () => new Error('LOAN_EXPIRED')
};

export const loanCommandHandler: (
  option: {
    enrollmentId: string;
    loanRepo: LoanRepo;
  }
) => LoanCommandHandler = ({
  enrollmentId, loanRepo
}) => ({
  ApplyLoan: async ({
    userId,
    payload: { loanId, description, reference, timestamp }
  }) => {
    if (!reference) throw Errors.requiredDataMissing();
    const events: any = [
      { type: 'LoanApplied', payload: { loanId, userId, timestamp }},
      { type: 'LoanReferenceDefined', payload: { loanId, userId, reference, timestamp }}
    ];
    if (description) events.push({ type: 'LoanDescriptionDefined', payload: { loanId, userId, description, timestamp }});
    return loanRepo
      .create({ enrollmentId, id: loanId })
      .save(events);
  },
  CancelLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) => {
    return loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) throw LoanErrors.loanNotFound(loanId);
        return save([{
          type: 'LoanCancelled',
          payload: { loanId, userId, timestamp }
        }]);
      });
  },
  ApproveLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) => {
    return loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) throw LoanErrors.loanNotFound(loanId);
        return save([{
          type: 'LoanApproved',
          payload: { loanId, userId, timestamp }
        }]);
      });
  },
  ReturnLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) => {
    return loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) throw LoanErrors.loanNotFound(loanId);
        return save([{
          type: 'LoanReturned',
          payload: { loanId, userId, timestamp }
        }]);
      });
  },
  RejectLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) => {
    return loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) throw LoanErrors.loanNotFound(loanId);
        return save([{
          type: 'LoanRejected',
          payload: { loanId, userId, timestamp }
        }]);
      });
  },
  ExpireLoan: async ({
    userId,
    payload: { loanId, timestamp }
  }) => {
    return loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) throw LoanErrors.loanNotFound(loanId);
        return save([{
          type: 'LoanExpired',
          payload: { loanId, userId, timestamp }
        }]);
      });
  },
  DefineLoanReference: async (_) => {
    throw Errors.invalidOperation(); // Readonly field
  },
  DefineLoanDescription: async ({
    userId,
    payload: { loanId, description, timestamp }
  }) => {
    return loanRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save }) => {
        if (!currentState) throw LoanErrors.loanNotFound(loanId);
        return save([{
          type: 'LoanDescriptionDefined',
          payload: { loanId, userId, description, timestamp }
        }]);
      });
  }
});
