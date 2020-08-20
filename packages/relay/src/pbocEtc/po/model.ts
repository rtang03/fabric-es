import { BaseEntity } from '@fabric-es/fabric-cqrs';
import { Attachment } from '..';

export class PoOrder extends BaseEntity {
  static entityName: 'poOrder';

  poId: string;
  sequenceNo: number;
  orderNo: string;
  orderDate: string;
  itemDescription: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  subtotalAmount: number;
  partialShipment: string;
  remarks?: string;
};

export class PO extends BaseEntity {
  static entityName: 'po';

  id: string;
  ownerId: string;
  timestamp: number;
  status: string;

  poId: string;
  poNo: string;
  versionNo: number;
  poDate: string;
  buyerId: string;
  buyerLei?: string;
  buyerName: string;
  buyerAddress: string;
  buyerBankName?: string;
  buyerBankAccount?: string;
  buyerAttention?: string;
  sellerId: string;
  sellerName: string;
  sellerAddress: string;
  sellerJurisdicationOfBr?: string;
  sellerBrCode: string;
  sellerAttention?: string;
  latestDeliveryDate: string;
  incotermsCode: string;
  incotermsLocation: string;
  shipFromAddress: string;
  shipToAddress: string;
  shipVia: string;
  paymentTerm?: string;
  goodsDescription: string;
  countryOfOrigin?: string;
  currency: string;
  settlementCurrency: string;
  settlementAmount: number;
  orderList: PoOrder[];
  attachmentList: Attachment[];
};
