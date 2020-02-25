import { ContactInfo, LoanRequester } from '..';

export interface LoanDetailsCommands {
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
    }
  };
  DefineLoanRequester: {
    userId: string;
    payload: {
      loanId: string;
      requester: LoanRequester;
      timestamp: number;
    }
  };
  DefineLoanContact: {
    userId: string;
    payload: {
      loanId: string;
      contact: ContactInfo;
      timestamp: number;
    }
  };
  DefineLoanType: {
    userId: string;
    payload: {
      loanId: string;
      loanType: string;
      timestamp: number;
    }
  };
  DefineLoanStartDate: {
    userId: string;
    payload: {
      loanId: string;
      startDate: number;
      timestamp: number;
    }
  };
  DefineLoanTenor: {
    userId: string;
    payload: {
      loanId: string;
      tenor: number;
      timestamp: number;
    }
  };
  DefineLoanCurrency: {
    userId: string;
    payload: {
      loanId: string;
      currency: string;
      timestamp: number;
    }
  };
  DefineLoanRequestedAmt: {
    userId: string;
    payload: {
      loanId: string;
      requestedAmt: number;
      timestamp: number;
    }
  };
  DefineLoanApprovedAmt: {
    userId: string;
    payload: {
      loanId: string;
      approvedAmt: number;
      timestamp: number;
    }
  };
  DefineLoanComment: {
    userId: string;
    payload: {
      loanId: string;
      comment: string;
      timestamp: number;
    }
  };
}