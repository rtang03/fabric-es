import { BaseEvent } from '@espresso/fabric-cqrs';

export interface LoanApplied extends BaseEvent {
  readonly type: 'LoanApplied';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanCancelled extends BaseEvent {
  readonly type: 'LoanCancelled';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanApproved extends BaseEvent {
  readonly type: 'LoanApproved';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanReturned extends BaseEvent {
  readonly type: 'LoanReturned';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanRejected extends BaseEvent {
  readonly type: 'LoanRejected';
  payload: {
    loanId: string;
    userId: string;
    timestamp: number;
  };
}

export interface LoanExpired extends BaseEvent {
  readonly type: 'LoanExpired';
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

export interface LoanCommentDefined extends BaseEvent {
  readonly type: 'LoanCommentDefined';
  payload: {
    loanId: string;
    userId: string;
    comment: string;
    timestamp: number;
  };
}

export type LoanEvents =
  | LoanApplied
  | LoanCancelled
  | LoanApproved
  | LoanReturned
  | LoanRejected
  | LoanExpired
  | LoanReferenceDefined
  | LoanDescriptionDefined
  | LoanCommentDefined;
