import { Errors } from '@espresso/common';
import { LoanDetailsCommandHandler, LoanDetailsRepo } from '.';
import { ContactInfo, LoanRequester } from './model';

const LoanDetailsErrors = {
  loanDetailsNotFound: (loanId) => new Error(`LOAN_DETAILS_NOT_FOUND: id: ${loanId}`)
};

const buildReqPayload: any = (loanId: string, userId: string, requester: LoanRequester, timestamp: number) => {
  const payload: any = {
    loanId,
    userId,
    registration: requester.registration,
    name: requester.name,
    timestamp
  };
  if (requester.type) payload.type = requester.type;
  return payload;
};

const buildCntPayload: any = (loanId: string, userId: string, contact: ContactInfo, timestamp: number) => {
  const payload: any = {
    loanId,
    userId,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    timestamp
  };
  if (contact.salutation) payload.salutation = contact.salutation;
  if (contact.title) payload.title = contact.title;
  return payload;
};

export const loanDetailsCommandHandler: (
  option: {
    enrollmentId: string;
    loanDetailsRepo: LoanDetailsRepo;
  }
) => LoanDetailsCommandHandler = ({
  enrollmentId, loanDetailsRepo
}) => ({
  CreateLoanDetails: async ({
    userId,
    payload: { loanId, requester, contact, loanType, startDate, tenor, currency, requestedAmt, approvedAmt, comment, timestamp }
  }) => {
    if (!requester) throw Errors.requiredDataMissing;
    if (!contact) throw Errors.requiredDataMissing;
    if (!startDate) throw Errors.requiredDataMissing;
    if (!tenor) throw Errors.requiredDataMissing;
    if (!currency) throw Errors.requiredDataMissing;
    if (!requestedAmt) throw Errors.requiredDataMissing;
    const events: any = [
      { type: 'LoanDetailsCreated', payload: { loanId, userId, timestamp }},
      { type: 'LoanRequesterDefined', payload: buildReqPayload(loanId, userId, requester, timestamp) },
      { type: 'LoanContactDefined', payload: buildCntPayload(loanId, userId, contact, timestamp) },
      { type: 'LoanStartDateDefined', payload: { loanId, userId, startDate, timestamp }},
      { type: 'LoanTenorDefined', payload: { loanId, userId, tenor, timestamp }},
      { type: 'LoanCurrencyDefined', payload: { loanId, userId, currency, timestamp }},
      { type: 'LoanRequestedAmtDefined', payload: { loanId, userId, requestedAmt, timestamp }}
    ];
    if (loanType) events.push({ type: 'LoanTypeDefined', payload: { loanId, userId, loanType, timestamp }});
    if (approvedAmt) events.push({ type: 'LoanApprovedAmtDefined', payload: { loanId, userId, approvedAmt, timestamp }});
    if (comment) events.push({ type: 'LoanCommentDefined', payload: { loanId, userId, comment, timestamp }});
    return loanDetailsRepo
      .create({ enrollmentId, id: loanId })
      .save(events);
  },
  DefineLoanRequester: async ({
    userId,
    payload: { loanId, requester, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState, save }) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        if (currentState.requester) throw Errors.invalidOperation; // Readonly field
        return save([{
          type: 'LoanRequesterDefined',
          payload: buildReqPayload(loanId, userId, requester, timestamp)
        }]);
      });
  },
  DefineLoanContact: async ({
    userId,
    payload: { loanId, contact, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: userId })
      .then(({ currentState, save }) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        return save([{
          type: 'LoanContactDefined',
          payload: buildCntPayload(loanId, userId, contact, timestamp)
        }]);
      });
  },
  DefineLoanType: async ({
    userId,
    payload: { loanId, loanType, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save}) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        return save([{
          type: 'LoanTypeDefined',
          payload: { loanId, userId, loanType, timestamp }
        }]);
      });
  },
  DefineLoanStartDate: async ({
    userId,
    payload: { loanId, startDate, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save}) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        return save([{
          type: 'LoanStartDateDefined',
          payload: { loanId, userId, startDate, timestamp }
        }]);
      });
  },
  DefineLoanTenor: async ({
    userId,
    payload: { loanId, tenor, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save}) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        return save([{
          type: 'LoanTenorDefined',
          payload: { loanId, userId, tenor, timestamp }
        }]);
      });
  },
  DefineLoanCurrency: async ({
    userId,
    payload: { loanId, currency, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save}) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        return save([{
          type: 'LoanCurrencyDefined',
          payload: { loanId, userId, currency, timestamp }
        }]);
      });
  },
  DefineLoanRequestedAmt: async ({
    userId,
    payload: { loanId, requestedAmt, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save}) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        return save([{
          type: 'LoanRequestedAmtDefined',
          payload: { loanId, userId, requestedAmt, timestamp }
        }]);
      });
  },
  DefineLoanApprovedAmt: async ({
    userId,
    payload: { loanId, approvedAmt, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save}) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        return save([{
          type: 'LoanApprovedAmtDefined',
          payload: { loanId, userId, approvedAmt, timestamp }
        }]);
      });
  },
  DefineLoanComment: async ({
    userId,
    payload: { loanId, comment, timestamp }
  }) => {
    return loanDetailsRepo
      .getById({ enrollmentId, id: loanId })
      .then(({ currentState, save}) => {
        if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
        return save([{
          type: 'LoanCommentDefined',
          payload: { loanId, userId, comment, timestamp }
        }]);
      });
  },
});