
export * from './reqres';
export * from './processMsg';
export * from './processNtt';
export * from './relayService';
export * from './snifferSubscription';
export * from './snifferService';
export * from './__tests__/mockUtils';

/**
 * /user/inquiry?sellerId=
 * 
 * >>> /order/po | POST (create); PUT (update); with file??? <<<
 * poList: [
 *  poBaseinfo: {
 *   poId
 *   poNo
 *   versionNo
 *   poDate
 *   buyerName ??
 *   buyerBankName ??
 *   buyerAttention?
 *   sellerName ??
 *   sellerAttention?
 *   latestDeliveryDate
 *   incotermsCode
 *   incotermsLocation
 *   shipFromAddress ??
 *   shipToAddress ??
 *   shipVia
 *   paymentTerm?
 *   goodsDescription
 *   countryofOrigin?
 *   currency ??
 *   settlementCurrency ??
 *   settlementAmount ??
 *  }
 *  orderList: [
 *   orderNo
 *   orderDate
 *   itemDescription
 *   partialShipment
 *   remarks?
 *  ]
 * ]
 * 
 * >>> /order/cancelPO | POST <<<
 * [
 *  poId
 *  reason?
 * ]
 * 
 * >>> /etccorp/pboc/api/v1/po/process | POST <<<
 * [
 *  poId
 *  versionNo
 *  actionResponse
 *  sellerBankName ??
 *  comment?
 * ]
 * 
 * >>> /etccorp/pboc/api/v1/invoices | POST (create); PUT (update); with file??? <<<
 * [
 *  invBaseInfo: {
 *   invoiceId
 *   invoiceNo
 *   versionNo
 *   invoiceDate
 *   sellerBankName ??
 *   attention?
 *   consigneeName?
 *   deliveryVehicle?
 *   logisticsServiceProvider?
 *   notifyPartyname?
 *   paymentMaturityDate
 *   shipmentDate
 *   buyerAttention?
 *   contractNo? ??
 *   shippingMarks?
 *   incotermsCode
 *   incotermsLocation
 *   shipFromAddress ??
 *   shipToAddress ??
 *   shipVia
 *   goodsDescription
 *   countryofOrigin?
 *   currency ??
 *   settlementCurrency ??
 *   settlementAmount ??
 *   poId
 *   poNo
 *   buyerName ??
 *   buyerBankName ??
 *   sellerName ??
 *   paymentTerm?
 *  }
 *  orderList: [
 *   orderNo
 *   orderDate
 *   itemDescription
 *   partialShipment
 *   remarks?
 *  ]
 * ]
 * 
 * >>> /etccorp/pboc/api/v1/invoices/notify | POST; with file??? <<<
 * [
 *  financeNo
 *  poId
 *  invoices: {
 *   invoiceId
 *   remark?
 *  }
 * ]
 * 
 * >>> /invoice/result | POST <<<
 * [
 *  invoiceId
 *  actionResponse
 *  goodsReceived
 *  receipDate?
 *  comment?
 * ]
 * 
 * >>> /trade-financing/invresult | POST <<<
 * [
 *  invoiceId
 *  paymentAmount ??
 *  paymentAmountCurrency ??
 *  paymentDate
 *  remittanceBank ??
 *  sellerBank ??
 *  goodsReceived?
 *  receipDate?
 * ]


`
[
  {
      "poBaseInfo": {
          "poId": "P12345001",
          "poNo": "PO001",
          "versionNo": 1,
          "poDate": "2020-08-07",
          "buyerId": "B12345001",
          "buyerName": "Buyer 001",
          "buyerAddress": "Address B001",
          "sellerId": "S12345001",
          "sellerName": "Seller 001",
          "sellerAddress": "Address S001",
          "sellerBrCode": "BR001",
          "latestDeliveryDate": "2021-08-07",
          "incotermsCode": "COD",
          "incotermsLocation": "HK",
          "shipFromAddress": "Address F001",
          "shipToAddress": "Address T001",
          "shipVia": "By Sea",
          "goodsDescription": "Some stuffs",
          "currency": "HKD",
          "settlementCurrency": "RMB",
          "settlementAmount": 50000
      },
      "orderList": [
          {
              "sequenceNo": 1,
              "orderNo": "PO00101",
              "orderDate": "2020-08-07",
              "itemDescription": "Stuff A",
              "unitPrice": 3000,
              "quantity": 10,
              "unit": "Piece",
              "subtotalAmount": 30000,
              "partialShipment": "N"
          },
          {
              "sequenceNo": 2,
              "orderNo": "PO00102",
              "orderDate": "2020-08-07",
              "itemDescription": "Stuff B",
              "unitPrice": 2000,
              "quantity": 10,
              "unit": "Piece",
              "subtotalAmount": 20000,
              "partialShipment": "N"
          }
      ]
  }
]
`;
*/