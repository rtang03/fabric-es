import { Errors } from '@fabric-es/gateway-lib';
import { loanDetailsCommandHandler as superHandler, LoanDetailsErrors } from '@fabric-es/model-loan-private';
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
    },
    DefineLoanContact: async ({ userId, payload: { loanId, contact, timestamp }}) =>
      loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        if (!contact.company && (typeof contact.company !== 'undefined')) throw Errors.requiredDataMissing();
        return handler.DefineLoanContact({ userId, payload: { loanId, contact, timestamp }});
      })
  };
};
