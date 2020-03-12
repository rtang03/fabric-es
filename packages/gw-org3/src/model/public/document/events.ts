import { BaseEvent } from '@fabric-es/fabric-cqrs';
import { DocumentEvents as SuperEvents } from '@fabric-es/model-loan';

export interface DocumentLinkDefined extends BaseEvent {
  readonly type: 'DocumentLinkDefined';
  payload: {
    documentId: string;
    userId: string;
    link: string;
    timestamp: number;
  };
}

export type DocumentEvents = SuperEvents | DocumentLinkDefined;
