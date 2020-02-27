import { LoanDetails, LoanDetailsEvents } from '..';

export const loanDetailsReducer = (details: LoanDetails, event: LoanDetailsEvents): LoanDetails => {
  switch (event.type) {
    case 'LoanDetailsCreated':
      return {
        loanId: event.payload.loanId,
        timestamp: event.payload.timestamp,
        requester: null,
        contact: null,
        startDate: null,
        tenor: null,
        currency: null,
        requestedAmt: null
      };
    case 'LoanRequesterDefined':
      const rqstr: any = {
        registration: event.payload.registration,
        name: event.payload.name,
      };
      if (event.payload.type) rqstr.type = event.payload.type;
      return {
        ...details,
        requester: rqstr
      };
    case 'LoanContactDefined':
      const cntct: any = {
        name: event.payload.name,
        phone: event.payload.phone,
        email: event.payload.email
      };
      if (event.payload.salutation) cntct.salutation = event.payload.salutation;
      if (event.payload.title) cntct.title = event.payload.title;
      return {
        ...details,
        contact: cntct
      };
    case 'LoanTypeDefined':
      return {
        ...details,
        loanType: event.payload.loanType
      };
    case 'LoanStartDateDefined':
      return {
        ...details,
        startDate: event.payload.startDate
      };
    case 'LoanTenorDefined':
      return {
        ...details,
        tenor: event.payload.tenor
      };
    case 'LoanCurrencyDefined':
      return {
        ...details,
        currency: event.payload.currency
      };
    case 'LoanRequestedAmtDefined':
      return {
        ...details,
        requestedAmt: event.payload.requestedAmt
      };
    case 'LoanApprovedAmtDefined':
      return {
        ...details,
        approvedAmt: event.payload.approvedAmt
      };
    case 'LoanCommentDefined':
      return {
        ...details,
        comment: event.payload.comment
      };
    default:
      return details; // NOTE!!! VERY IMPORTANT! do not omit this case, otherwise will return null if contain unrecognized events
  }
};
