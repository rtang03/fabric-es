import { BaseEvent } from '@espresso/fabric-cqrs';

export interface ApprovedDocumentRejected extends BaseEvent {
  readonly type: 'ApprovedDocumentRejected';
  payload: {
    userId: string;
    documentId: string;
    timestamp: number;
  };
}

export interface DocumentApproved extends BaseEvent {
  readonly type: 'DocumentApproved';
  payload: {
    documentId: string;
    timestamp: number;
  };
}

export interface DocumentBanned extends BaseEvent {
  readonly type: 'DocumentBanned';
  payload: {
    userId: string;
    documentId: string;
    timestamp: number;
  };
}

export interface DocumentCreated extends BaseEvent {
  readonly type: 'DocumentCreated';
  payload: {
    documentId: string;
    tradeId: string;
    ownerId: string;
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

export interface DocumentDescriptionDefined extends BaseEvent {
  readonly type: 'DocumentDescriptionDefined';
  payload: {
    documentId: string;
    description: string;
    timestamp: number;
  };
}

export interface DocumentLinkDefined extends BaseEvent {
  readonly type: 'DocumentLinkDefined';
  payload: {
    documentId: string;
    link: string;
    timestamp: number;
  };
}

export interface DocumentRejected extends BaseEvent {
  readonly type: 'DocumentRejected';
  payload: {
    documentId: string;
    timestamp: number;
  };
}

export interface DocumentResubmitted extends BaseEvent {
  readonly type: 'DocumentResubmitted';
  payload: {
    documentId: string;
    timestamp: number;
  };
}

export interface DocumentReviewed extends BaseEvent {
  readonly type: 'DocumentReviewed';
  payload: {
    documentId: string;
    reviewerId: string;
    evaluation: string;
    timestamp: number;
  };
}

export interface DocumentReviewerInvited extends BaseEvent {
  readonly type: 'DocumentReviewerInvited';
  payload: {
    documentId: string;
    reviewerId: string;
    timestamp: number;
  };
}

export interface DocumentReviewerRemoved extends BaseEvent {
  readonly type: 'DocumentReviewerRemoved';
  payload: {
    documentId: string;
    reviewerId: string;
    timestamp: number;
  };
}

export interface DocumentTitleDefined extends BaseEvent {
  readonly type: 'DocumentTitleDefined';
  payload: {
    documentId: string;
    title: string;
    timestamp: number;
  };
}

export interface DocumentUnbanned extends BaseEvent {
  readonly type: 'DocumentUnbanned';
  payload: {
    userId: string;
    documentId: string;
    timestamp: number;
  };
}

export type DocumentEvent =
  | ApprovedDocumentRejected
  | DocumentApproved
  | DocumentBanned
  | DocumentCreated
  | DocumentDeleted
  | DocumentDescriptionDefined
  | DocumentLinkDefined
  | DocumentRejected
  | DocumentResubmitted
  | DocumentReviewed
  | DocumentReviewerInvited
  | DocumentReviewerRemoved
  | DocumentTitleDefined
  | DocumentUnbanned;
