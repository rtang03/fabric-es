import { ContactInfo as SuperContactInfo, LoanDetails as SuperDetails } from '@espresso/model-loan-private';

export type ContactInfo = SuperContactInfo & {
  company: string;
};

/**
 * **LoanDetails** is the private counterpart of the on-chain entity **Loan**, containing non-public details of a loan
 * for authorized parties' use only.
 */
export class LoanDetails extends SuperDetails {
  static type: 'LoanDetails';

  contact: ContactInfo;
}
