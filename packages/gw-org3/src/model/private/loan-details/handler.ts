import { Errors } from '@espresso/gw-node';
import { loanDetailsCommandHandler as superHandler } from '@espresso/model-loan-private';
import { LoanDetailsCommandHandler, LoanDetailsRepo } from '.';

export const loanDetailsCommandHandler: (option: {
  enrollmentId: string;
  loanDetailsRepo: LoanDetailsRepo;
}) => LoanDetailsCommandHandler = ({ enrollmentId, loanDetailsRepo }) => {
  const handler = superHandler({ enrollmentId, loanDetailsRepo });
  return {
    ...handler,
    CreateLoanDetails: async ({
      userId,
      payload: {
        loanId,
        requester,
        contact,
        loanType,
        startDate,
        tenor,
        currency,
        requestedAmt,
        approvedAmt,
        comment,
        timestamp
      }
    }) => {
      if (!contact || !contact.company) throw Errors.requiredDataMissing();
      return handler.CreateLoanDetails({
        userId,
        payload: {
          loanId,
          requester,
          contact,
          loanType,
          startDate,
          tenor,
          currency,
          requestedAmt,
          approvedAmt,
          comment,
          timestamp
        }
      });
    }
  };
};
