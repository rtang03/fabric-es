import { loanDetailsReducer as superReducer } from '@fabric-es/model-loan';
import type { LoanDetails, LoanDetailsEvents } from '.';

export const loanDetailsReducer = (details: LoanDetails, event: LoanDetailsEvents): LoanDetails => {
  switch (event.type) {
    case 'LoanContactDefined':
      const cntct: any = {
        company: event.payload.company,
        name: event.payload.name,
        phone: event.payload.phone,
        email: event.payload.email,
      };
      if (event.payload.salutation) cntct.salutation = event.payload.salutation;
      if (event.payload.title) cntct.title = event.payload.title;
      return {
        ...details,
        contact: cntct,
      };
    // dummy code
    default:
      return superReducer(details, event) as LoanDetails;
  }
};
