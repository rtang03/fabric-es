import { BaseEntity } from '@fabric-es/fabric-cqrs';

export class InvOrder extends BaseEntity {
  static entityName: 'invOrder';

  invoiceId: string;
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

export class Invoice extends BaseEntity {
  static entityName: 'invoice';

  id: string;
  ownerId: string;
  timestamp: number;
  status: string;

  poId: string;
  poNo: string;
  invoiceId: string;
  invoiceNo: string;
  versionNo: number;
  invoiceDate: string;
  buyerId: string;
  buyerName: string;
  buyerAddress: string;
  buyerBankName: string;
  buyerBankAccount: string;
  buyerAttention?: string;
  sellerId: string;
  sellerName: string;
  sellerAddress: string;
  sellerBankName: string;
  sellerBankAccount: string;
  attention?: string;
  consigneeName?: string;
  deliveryVehicle?: string;
  logisticsServiceProvider?: string;
  notifyPartyName?: string;
  paymentMaturityDate: string;
  shipmentDate: string;
  contractNo?: string;
  shippingMarks?: string;
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
  orderList: InvOrder[];
};