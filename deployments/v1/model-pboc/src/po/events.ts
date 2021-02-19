import { BaseEvent, Lifecycle } from '@fabric-es/fabric-cqrs';
import { PoOrder } from '.';

export type PoPayload = {
  userId: string;
  timestamp: number;
  poId: string;
  // poNo: string;
  versionNo: number;
  // poDate: string;
  // buyerId: string;
  // buyerLei?: string;
  // buyerName: string;
  // buyerAddress: string;
  // buyerBankName?: string;
  // buyerBankAccount?: string;
  // buyerAttention?: string;
  // sellerId: string;
  // sellerName: string;
  // sellerAddress?: string;
  // sellerJurisdicationOfBr?: string;
  // sellerBrCode: string;
  // sellerAttention?: string;
  // latestDeliveryDate: string;
  incotermsCode: string;
  // incotermsLocation: string;
  // shipFromAddress: string;
  // shipToAddress: string;
  shipVia: string;
  // paymentTerm?: string;
  // goodsDescription: string;
  // countryOfOrigin?: string;
  currency: string;
  settlementCurrency: string;
  settlementAmount: number;
  orderList: PoOrder[];
  // attachmentList: Attachment[];
};

export interface PoCreated extends BaseEvent {
  readonly type: 'PoCreated';
  readonly lifeCycle: Lifecycle.BEGIN;
  payload: PoPayload;
};

export interface PoUpdated extends BaseEvent {
  readonly type: 'PoUpdated';
  // readonly lifeCycle: Lifecycle.INTERMEDIATE;
  payload: PoPayload;
};

export interface PoCancelled extends BaseEvent {
  readonly type: 'PoCancelled';
  // readonly lifeCycle: Lifecycle.INTERMEDIATE;
  payload: {
    userId: string;
    timestamp: number;
    poId: string;
    // reason?: string;
  };
};

export interface PoProcessed extends BaseEvent {
  readonly type: 'PoProcessed';
  // readonly lifeCycle: Lifecycle.INTERMEDIATE;
  payload: {
    userId: string;
    timestamp: number;
    poId: string;
    versionNo: number;
    actionResponse: string;
    // sellerId: string;
    // sellerBankName: string;
    // sellerBankAccount: string;
    // comment?: string;
  };
};

export type PoEvents =
  PoCreated | PoUpdated | PoCancelled | PoProcessed;
