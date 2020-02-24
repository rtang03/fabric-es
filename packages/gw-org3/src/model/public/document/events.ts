import { BaseEvent } from '@espresso/fabric-cqrs';
import { DocumentEvents as SuperEvents } from '@espresso/model-loan';

export interface DocumentLinkDefined extends BaseEvent {
  readonly type: 'DocumentLinkDefined';
  payload: {
    documentId: string;
    userId: string;
    link: string;
    timestamp: number;
  };
}

export type DocumentEvents =
  SuperEvents |
  DocumentLinkDefined;
