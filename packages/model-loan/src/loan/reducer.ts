import { Loan, LoanEvents, LoanStatus } from '.';

export const loanReducer = (loan: Loan, event: LoanEvents): Loan => {
  switch (event.type) {
    case 'LoanApplied':
      return {
        loanId: event.payload.loanId,
        ownerId: event.payload.userId,
        status: LoanStatus[event.type],
        timestamp: event.payload.timestamp,
        reference: null
      };
    case 'LoanCancelled':
    case 'LoanApproved':
    case 'LoanReturned':
    case 'LoanRejected':
    case 'LoanExpired':
      return {
        ...loan,
        status: LoanStatus[event.type]
      };
    case 'LoanReferenceDefined':
      return {
        ...loan,
        reference: event.payload.reference
      };
    case 'LoanDescriptionDefined':
      return {
        ...loan,
        description: event.payload.description
      };
    default:
      return loan; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};
