import { BaseEvent, Lifecycle } from '@fabric-es/fabric-cqrs';
import { InvOrder } from '.';

export type InvPayload = {
  userId: string;
  timestamp: number;
  poId: string;
  // poNo: string;
  invoiceId: string;
  // invoiceNo: string;
  versionNo: number;
  // invoiceDate: string;
  // buyerId: string;
  // buyerName: string;
  // buyerAddress: string;
  // buyerBankName: string;
  // buyerBankAccount: string;
  // buyerAttention?: string;
  // sellerId: string;
  // sellerName: string;
  // sellerAddress: string;
  // sellerBankName: string;
  // sellerBankAccount: string;
  // attention?: string;
  // consigneeName?: string;
  // deliveryVehicle?: string;
  // logisticsServiceProvider?: string;
  // notifyPartyName?: string;
  // paymentMaturityDate: string;
  // shipmentDate: string;
  // contractNo?: string;
  // shippingMarks?: string;
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
  orderList: InvOrder[];
  // attachmentList: Attachment[];
};

export interface InvoiceCreated extends BaseEvent {
  readonly type: 'InvoiceCreated';
  readonly lifeCycle: Lifecycle.BEGIN;
  payload: InvPayload;
};

export interface InvoiceUpdated extends BaseEvent {
  readonly type: 'InvoiceUpdated';
  payload: InvPayload;
};

export interface InvoiceTransferred extends BaseEvent {
  readonly type: 'InvoiceTransferred';
  payload: {
    userId: string;
    timestamp: number;
    invoiceId: string;
    // remark?: string;
    // financeNo: string;
    poId: string;
    // attachmentList: Attachment[];
  };
};

export interface InvoiceImageUploaded extends BaseEvent {
  readonly type: 'InvoiceImageUploaded';
  payload: {
    userId: string;
    timestamp: number;
    invoiceId: string;
    // attachmentList: Attachment[];
  };
};

export interface InvoiceConfirmed extends BaseEvent {
  readonly type: 'InvoiceConfirmed';
  payload: {
    userId: string;
    timestamp: number;
    invoiceId: string;
    versionNo: number;
    actionResponse: string;
    // goodsReceived?: string;
    // receiptDate?: string;
    // comment?: string;
  };
};

export interface PaymentStatusUpdated extends BaseEvent {
  readonly type: 'PaymentStatusUpdated';
  payload: {
    userId: string;
    timestamp: number;
    invoiceId: string;
    // paymentAmount: string;
    // paymentAmountCurrency: string;
    // paymentDate: string;
    // remittanceBank: string;
    // remittanceRemarks?: string;
    // sellerBank: string;
    // sellerBankAccount?: string;
    // goodsReceived?: boolean;
    // receiptDate?: string;
  };
};

export type InvoiceEvents =
  InvoiceCreated | InvoiceUpdated | InvoiceTransferred | InvoiceImageUploaded | InvoiceConfirmed | PaymentStatusUpdated;
