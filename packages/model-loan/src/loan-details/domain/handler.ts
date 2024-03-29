import { Errors } from '@fabric-es/gateway-lib';
import { LoanDetailsCommandHandler, LoanDetailsRepo } from '.';

export const LoanDetailsErrors = {
  loanDetailsNotFound: (loanId) => new Error(`LOAN_DETAILS_NOT_FOUND: id: ${loanId}`),
};

export const loanDetailsCommandHandler: (option: {
  enrollmentId: string;
  loanDetailsRepo: LoanDetailsRepo;
}) => LoanDetailsCommandHandler = ({ enrollmentId, loanDetailsRepo }) => ({
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
      timestamp,
    },
  }) => {
    if (!requester || !requester.registration || !requester.name)
      throw Errors.requiredDataMissing();
    if (!contact || !contact.name || !contact.phone || !contact.email)
      throw Errors.requiredDataMissing();
    if (!startDate) throw Errors.requiredDataMissing();
    if (!tenor) throw Errors.requiredDataMissing();
    if (!currency) throw Errors.requiredDataMissing();
    if (!requestedAmt) throw Errors.requiredDataMissing();

    const events: any = [
      { type: 'LoanDetailsCreated', payload: { loanId, userId, timestamp } },
      { type: 'LoanRequesterDefined', payload: { loanId, userId, timestamp, ...requester } },
      { type: 'LoanContactDefined', payload: { loanId, userId, timestamp, ...contact } },
      { type: 'LoanStartDateDefined', payload: { loanId, userId, startDate, timestamp } },
      { type: 'LoanTenorDefined', payload: { loanId, userId, tenor, timestamp } },
      { type: 'LoanCurrencyDefined', payload: { loanId, userId, currency, timestamp } },
      { type: 'LoanRequestedAmtDefined', payload: { loanId, userId, requestedAmt, timestamp } },
    ];

    if (loanType)
      events.push({ type: 'LoanTypeDefined', payload: { loanId, userId, loanType, timestamp } });

    if (approvedAmt)
      events.push({
        type: 'LoanApprovedAmtDefined',
        payload: { loanId, userId, approvedAmt, timestamp },
      });

    if (comment)
      events.push({
        type: 'LoanDtlCommentDefined',
        payload: { loanId, userId, comment, timestamp },
      });

    return loanDetailsRepo
      .create({ enrollmentId, id: loanId })
      .save({ events })
      .then(({ data }) => data);
  },
  DefineLoanRequester: async (_) => {
    throw Errors.invalidOperation(); // Readonly field
  },
  DefineLoanContact: async ({ userId, payload: { loanId, contact, timestamp } }) =>
    loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
      if (!contact.name && typeof contact.name !== 'undefined') throw Errors.requiredDataMissing();
      if (!contact.phone && typeof contact.phone !== 'undefined')
        throw Errors.requiredDataMissing();
      if (!contact.email && typeof contact.email !== 'undefined')
        throw Errors.requiredDataMissing();

      const payload = {
        loanId,
        userId,
        timestamp,
        ...currentState.contact,
      };

      return save({
        events: [{ type: 'LoanContactDefined', payload: Object.assign(payload, contact) }],
      }).then(({ data }) => data);
    }),
  DefineLoanType: async ({ userId, payload: { loanId, loanType, timestamp } }) =>
    loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);

      return save({
        events: [{ type: 'LoanTypeDefined', payload: { loanId, userId, loanType, timestamp } }],
      }).then(({ data }) => data);
    }),
  DefineLoanStartDate: async ({ userId, payload: { loanId, startDate, timestamp } }) => {
    // loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
    //   if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
    //   return save([
    //     { type: 'LoanStartDateDefined', payload: { loanId, userId, startDate, timestamp }}
    //   ]);
    // }),
    throw Errors.invalidOperation(); // Readonly field
  },
  DefineLoanTenor: async ({ userId, payload: { loanId, tenor, timestamp } }) =>
    loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
      if (!tenor) throw Errors.requiredDataMissing();

      return save({
        events: [{ type: 'LoanTenorDefined', payload: { loanId, userId, tenor, timestamp } }],
      }).then(({ data }) => data);
    }),
  DefineLoanCurrency: async ({ userId, payload: { loanId, currency, timestamp } }) =>
    loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
      if (!currency) throw Errors.requiredDataMissing();

      return save({
        events: [{ type: 'LoanCurrencyDefined', payload: { loanId, userId, currency, timestamp } }],
      }).then(({ data }) => data);
    }),
  DefineLoanRequestedAmt: async ({ userId, payload: { loanId, requestedAmt, timestamp } }) =>
    loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);
      if (!requestedAmt) throw Errors.requiredDataMissing();

      return save({
        events: [
          { type: 'LoanRequestedAmtDefined', payload: { loanId, userId, requestedAmt, timestamp } },
        ],
      }).then(({ data }) => data);
    }),
  DefineLoanApprovedAmt: async ({ userId, payload: { loanId, approvedAmt, timestamp } }) =>
    loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);

      return save({
        events: [
          { type: 'LoanApprovedAmtDefined', payload: { loanId, userId, approvedAmt, timestamp } },
        ],
      }).then(({ data }) => data);
    }),
  DefineLoanDtlComment: async ({ userId, payload: { loanId, comment, timestamp } }) =>
    loanDetailsRepo.getById({ enrollmentId, id: loanId }).then(({ currentState, save }) => {
      if (!currentState) throw LoanDetailsErrors.loanDetailsNotFound(loanId);

      return save({
        events: [
          { type: 'LoanDtlCommentDefined', payload: { loanId, userId, comment, timestamp } },
        ],
      }).then(({ data }) => data);
    }),
});
