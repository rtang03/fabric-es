import { BaseEvent } from '@espresso/fabric-cqrs';

export interface DocContentsCreated extends BaseEvent {
  readonly type: 'DocContentsCreated';
  payload: {
    documentId: string;
    userId: string;
    timestamp: number;
  };
}

export interface DocContentsDataDefined extends BaseEvent {
  readonly type: 'DocContentsDataDefined';
  payload: {
    documentId: string;
    userId: string;
    body: string;
    timestamp: number;
  };
}

export interface DocContentsFileDefined extends BaseEvent {
  readonly type: 'DocContentsFileDefined';
  payload: {
    documentId: string;
    userId: string;
    format: string;
    link: string;
    timestamp: number;
  };
}

export type DocContentsEvents =
  DocContentsCreated |
  DocContentsDataDefined |
  DocContentsFileDefined;
