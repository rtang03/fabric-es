import { BaseEvent, Lifecycle } from '@fabric-es/fabric-cqrs';

export interface DocumentCreated extends BaseEvent {
  readonly type: 'DocumentCreated';
  readonly lifeCycle: Lifecycle.BEGIN;
  payload: {
    documentId: string;
    userId: string;
    timestamp: number;
  };
}

export interface DocumentDeleted extends BaseEvent {
  readonly type: 'DocumentDeleted';
  readonly lifeCycle: Lifecycle.END;
  payload: {
    documentId: string;
    userId: string;
    timestamp: number;
  };
}

export interface DocumentAccessRestricted extends BaseEvent {
  readonly type: 'DocumentRestricted';
  payload: {
    documentId: string;
    userId: string;
    timestamp: number;
  };
}

export interface DocumentReferenceDefined extends BaseEvent {
  readonly type: 'DocumentReferenceDefined';
  payload: {
    documentId: string;
    userId: string;
    reference: string;
    timestamp: number;
  };
}

export interface DocumentLoanIdDefined extends BaseEvent {
  readonly type: 'DocumentLoanIdDefined';
  payload: {
    documentId: string;
    userId: string;
    loanId: string;
    timestamp: number;
  };
}

export interface DocumentTitleDefined extends BaseEvent {
  readonly type: 'DocumentTitleDefined';
  payload: {
    documentId: string;
    userId: string;
    title: string;
    timestamp: number;
  };
}

export type DocumentEvents =
  | DocumentCreated
  | DocumentDeleted
  | DocumentAccessRestricted
  | DocumentReferenceDefined
  | DocumentLoanIdDefined
  | DocumentTitleDefined;
