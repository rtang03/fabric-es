import { BaseEvent } from '@espresso/fabric-cqrs';

export interface LoanDetailsCreated extends BaseEvent {
  readonly type: 'LoanDetailsCreated';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanRequesterDefined extends BaseEvent {
  readonly type: 'LoanRequesterDefined';
  payload: {
    loanId: string;
    userId: string;
    registration: string;
    name: string;
    type?: string;
    timestamp: number;
  };
}

export interface LoanContactDefined extends BaseEvent {
  readonly type: 'LoanContactDefined';
  payload: {
    loanId: string;
    userId: string;
    salutation?: string;
    name: string;
    title?: string;
    phone: string;
    email: string;
    timestamp: number;
  };
}

export interface LoanStartDateDefined extends BaseEvent {
  readonly type: 'LoanStartDateDefined';
  payload: {
    loanId: string;
    userId: string;
    startDate: number;
    timestamp: number;
  };
}

export interface LoanTenorDefined extends BaseEvent {
  readonly type: 'LoanTenorDefined';
  payload: {
    loanId: string;
    userId: string;
    tenor: number;
    timestamp: number;
  };
}

export interface LoanCurrencyDefined extends BaseEvent {
  readonly type: 'LoanCurrencyDefined';
  payload: {
    loanId: string;
    userId: string;
    currency: string;
    timestamp: number;
  };
}

export interface LoanRequestedAmtDefined extends BaseEvent {
  readonly type: 'LoanRequestedAmtDefined';
  payload: {
    loanId: string;
    userId: string;
    requestedAmt: number;
    timestamp: number;
  };
}

export interface LoanApprovedAmtDefined extends BaseEvent {
  readonly type: 'LoanApprovedAmtDefined';
  payload: {
    loanId: string;
    userId: string;
    approvedAmt: number;
    timestamp: number;
  };
}

export interface LoanCommentDefined extends BaseEvent {
  readonly type: 'LoanCommentDefined';
  payload: {
    loanId: string;
    userId: string;
    comment: string;
    timestamp: number;
  };
}
