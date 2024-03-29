import type { LoanDetailsCommands as SuperCommands, LoanRequester } from '@fabric-es/model-loan';
import type { ContactInfo } from '.';

export interface LoanDetailsCommands extends SuperCommands {
  CreateLoanDetails: {
    userId: string;
    payload: {
      loanId: string;
      requester: LoanRequester;
      contact: ContactInfo;
      loanType?: string;
      startDate: number;
      tenor: number;
      currency: string;
      requestedAmt: number;
      approvedAmt?: number;
      comment?: string;
      timestamp: number;
    };
  };
  DefineLoanContact: {
    userId: string;
    payload: {
      loanId: string;
      contact: ContactInfo;
      timestamp: number;
    };
  };
}
