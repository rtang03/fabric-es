export enum LoanStatus {
  applied, cancelled, approved, returned, rejected, expired
}

export class Loan {
  static type: 'Loan';

  loanId: string;
  description?: string;
  loanProductId: string;
  status: LoanStatus;
  ownerId: string;
  timestamp: number;
}
