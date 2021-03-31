import type { BaseEntity } from '@fabric-es/fabric-cqrs';

export type LoanRequester = {
  registration: string;
  name: string;
  type?: string;
};

export type ContactInfo = {
  salutation?: string;
  name: string;
  title?: string;
  phone: string;
  email: string;
};

/**
 * **LoanDetails** is the private counterpart of the on-chain entity **Loan**, containing non-public details of a loan
 * for authorized parties' use only.
 */
export class LoanDetails implements BaseEntity {
  static entityName = 'loanDetails';
  static parentName = 'loan';

  id: string;
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
