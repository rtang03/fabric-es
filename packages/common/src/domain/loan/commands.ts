export interface LoanCommands {
  ApplyLoan: {
    userId: string;
    payload: {
      loanId: string;
      description?: string;
      reference: string;
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
  DefineLoanReference: {
    userId: string;
    payload: {
      loanId: string;
      reference: string;
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
}