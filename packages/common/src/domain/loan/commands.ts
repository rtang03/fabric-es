export interface LoanCommands {
  ApplyLoan: {
    userId: string;
    payload: {
      loanId: string;
      description?: string;
      loanProductId: string;
      timestamp: number;
    }
  };
  CancelLoan: {
    userId: string;
    payload: {
      loanId: string;
      timestamp: number;
    }
  };
  ApproveLoan: {
    userId: string;
    payload: {
      loanId: string;
      timestamp: number;
    }
  };
  ReturnLoan: {
    userId: string;
    payload: {
      loanId: string;
      timestamp: number;
    }
  };
  RejectLoan: {
    userId: string;
    payload: {
      loanId: string;
      timestamp: number;
    }
  };
  ExpireLoan: {
    userId: string;
    payload: {
      loanId: string;
      timestamp: number;
    }
  };
  DefineLoanDescription: {
    userId: string;
    payload: {
      loanId: string;
      description: string;
      timestamp: number;
    }
  };
  UpdateLoanProduct: {
    userId: string;
    payload: {
      loanId: string;
      loanProductId: string;
      timestamp: number;
    }
  };
}