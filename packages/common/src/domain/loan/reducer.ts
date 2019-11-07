import { Loan, LoanEvent, LoanStatus } from '.';

export const loanReducer = (
  history: LoanEvent[],
  initialState?: Loan
): Loan => {
  const reducer = (loan: Loan, event: LoanEvent): Loan => {
    switch (event.type) {
      case 'applied':
        return {
          loanId: event.payload.loanId,
          status: LoanStatus[event.type],
          ownerId: event.payload.userId,
          timestamp: event.payload.timestamp,
          reference: null,
          loanProductId: null
        };
      case 'cancelled':
      case 'approved':
      case 'returned':
      case 'rejected':
      case 'expired':
        // loan.status = LoanStatus[event.type];
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
      case 'LoanProductDefined':
        return {
          ...loan,
          loanProductId: event.payload.loanProductId
        };
    }
  };

  return history.reduce(reducer, initialState);
};