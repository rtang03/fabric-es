import { BaseEvent } from '@espresso/fabric-cqrs';

export interface LoanApplied extends BaseEvent {
  readonly type: 'applied';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanCancelled extends BaseEvent {
  readonly type: 'cancelled';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanApproved extends BaseEvent {
  readonly type: 'approved';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanReturned extends BaseEvent {
  readonly type: 'returned';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanRejected extends BaseEvent {
  readonly type: 'rejected';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanExpired extends BaseEvent {
  readonly type: 'expired';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanReferenceDefined extends BaseEvent {
  readonly type: 'LoanReferenceDefined';
  payload: {
    loanId: string;
    userId: string;
    reference: string;
    timestamp: number;
  };
}

export interface LoanDescriptionDefined extends BaseEvent {
  readonly type: 'LoanDescriptionDefined';
  payload: {
    loanId: string;
    userId: string;
    description: string;
    timestamp: number;
  };
}

export interface LoanProductDefined extends BaseEvent {
  readonly type: 'LoanProductDefined';
  payload: {
    loanId: string;
    userId: string;
    loanProductId: string;
    timestamp: number;
  };
}

export type LoanEvent =
  LoanApplied |
  LoanCancelled |
  LoanApproved |
  LoanReturned |
  LoanRejected |
  LoanExpired |
  LoanReferenceDefined |
  LoanDescriptionDefined |
  LoanProductDefined;