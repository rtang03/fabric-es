import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { Errors } from '@fabric-es/gateway-lib';
import { LoanCommandHandler, LoanEvents, LoanRepo } from '..';

export const LoanErrors = {
  loanNotFound: loanId => new Error(`LOAN_NOT_FOUND: id: ${loanId}`),
  loanCancelled: () => new Error('LOAN_CANCELLED'),
  loanApproved: () => new Error('LOAN_APPROVED'),
  loanReturned: () => new Error('LOAN_RETURNED'),
  loanRejected: () => new Error('LOAN_REJECTED'),
  loanExpired: () => new Error('LOAN_EXPIRED')
};

export const loanCommandHandler: (option: { enrollmentId: string; loanRepo: LoanRepo }) => LoanCommandHandler = ({
  enrollmentId,
  loanRepo
}) => ({
  ApplyLoan: async ({ userId, payload: { loanId, description, reference, comment, timestamp } }) => {
    if (!reference) throw Errors.requiredDataMissing();
    if (!description) throw Errors.requiredDataMissing();
    const events: LoanEvents[] = [
      { type: 'LoanApplied', lifeCycle: Lifecycle.BEGIN, payload: { loanId, userId, timestamp }},
      { type: 'LoanReferenceDefined', payload: { loanId, userId, reference, timestamp }},
      { type: 'LoanDescriptionDefined', payload: { loanId, userId, description, timestamp }}
    ];
    if (comment) {
      events.push({ type: 'LoanCommentDefined', payload: { loanId, userId, comment, timestamp }});
    }
    return loanRepo.create({ enrollmentId, id: loanId }).save(events);
  },
  CancelLoan: async ({ userId, payload: { loanId, timestamp } }) =>
    loanRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanErrors.loanNotFound(loanId);
      return save([
        { type: 'LoanCancelled', payload: { loanId, userId, timestamp }}
      ]);
    }),
  ApproveLoan: async ({ userId, payload: { loanId, timestamp } }) =>
    loanRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanErrors.loanNotFound(loanId);
      return save([
        { type: 'LoanApproved', payload: { loanId, userId, timestamp }}
      ]);
    }),
  ReturnLoan: async ({ userId, payload: { loanId, timestamp } }) =>
    loanRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanErrors.loanNotFound(loanId);
      return save([
        { type: 'LoanReturned', payload: { loanId, userId, timestamp }}
      ]);
    }),
  RejectLoan: async ({ userId, payload: { loanId, timestamp } }) =>
    loanRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanErrors.loanNotFound(loanId);
      return save([
        { type: 'LoanRejected', payload: { loanId, userId, timestamp }}
      ]);
    }),
  ExpireLoan: async ({ userId, payload: { loanId, timestamp } }) =>
    loanRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanErrors.loanNotFound(loanId);
      return save([
        { type: 'LoanExpired', payload: { loanId, userId, timestamp }}
      ]);
    }),
  DefineLoanReference: async _ => {
    throw Errors.invalidOperation(); // Readonly field
  },
  DefineLoanDescription: async ({ userId, payload: { loanId, description, timestamp } }) =>
    loanRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanErrors.loanNotFound(loanId);
      if (!description) throw Errors.requiredDataMissing();
      return save([
        { type: 'LoanDescriptionDefined', payload: { loanId, userId, description, timestamp }}
      ]);
    }),
  DefineLoanComment: async ({ userId, payload: { loanId, comment, timestamp }}) =>
    loanRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanErrors.loanNotFound(loanId);
      return save([
        { type: 'LoanCommentDefined', payload: { loanId, userId, comment, timestamp }}
      ]);
    })
});
