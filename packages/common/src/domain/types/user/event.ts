import { BaseEvent } from '@espresso/fabric-cqrs';

export interface UserCreated extends BaseEvent {
  readonly type: 'UserCreated';
  payload: {
    userId: string;
    name: string;
    mergedUserIds: string[];
    timestamp: number;
  };
}

export interface ReviewInvitationDeclined extends BaseEvent {
  readonly type: 'ReviewInvitationDeclined';
  payload: {
    reviewOwnerId: string;
    documentId: string;
    tradeId: string;
    timestamp: number;
  };
}

export interface ReviewInvitationExpired extends BaseEvent {
  readonly type: 'ReviewInvitationExpired';
  payload: {
    reviewOwnerId: string;
    documentId: string;
    tradeId: string;
    timestamp: number;
  };
}

export type UserEvent =
  | UserCreated
  | ReviewInvitationDeclined
  | ReviewInvitationExpired;
