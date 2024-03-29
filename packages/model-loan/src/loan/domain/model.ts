import type { BaseEntity } from '@fabric-es/fabric-cqrs';

export enum LoanStatus {
  LoanApplied,
  LoanCancelled,
  LoanApproved,
  LoanReturned,
  LoanRejected,
  LoanExpired,
}

/**
 * **Loan** is one of the on-chain top-level entities. Being globally accessible, it serves as an anchor point of all information related
 * to a loan request scattered among the participating organizations. Each loan is uniquely identified by a `loanId`. The
 * loan applicants may also utilize the `reference` property as their internal identifier unique within their individual organizations.
 */
export class Loan implements BaseEntity {
  static entityName = 'loan';

  id: string;
  loanId: string;
  ownerId: string;
  description: string;
  reference: string;
  status: LoanStatus;
  comment?: string;
  timestamp: number;
}
