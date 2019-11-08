import { BaseEvent } from '@espresso/fabric-cqrs';

export interface DocumentCreated extends BaseEvent {
  readonly type: 'DocumentCreated';
  payload: {
    documentId: string;
    userId: string;
    timestamp: number;
  };
}

export interface DocumentDeleted extends BaseEvent {
  readonly type: 'DocumentDeleted';
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

export interface DocumentLinkDefined extends BaseEvent {
  readonly type: 'DocumentLinkDefined';
  payload: {
    documentId: string;
    userId: string;
    link: string;
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
  DocumentCreated |
  DocumentDeleted |
  DocumentAccessRestricted |
  DocumentReferenceDefined |
  DocumentLinkDefined |
  DocumentLoanIdDefined |
  DocumentTitleDefined;
