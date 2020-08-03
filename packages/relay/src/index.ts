
/**
 * >>> /order/po | POST (create); PUT (update) <<<
 * poList: [
 *  poBaseinfo: {
 *   poId
 *   poNo
 *   versionNo
 *   poDate
 *   buyerName ??
 *   buyerBankName ??
 *   sellerName ??
 *   attention?
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
 * >>> /api/v1/po/process | POST <<<
 * [
 *  poId
 *  versionNo
 *  actionResponse
 *  sellerBankName ??
 *  comment?
 * ]
 * 
 * >>> /api/v1/invoices | POST (create); PUT (update) <<<
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
 * >>> /api/v1/invoices/notify | POST <<<
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
 * >>> [renew payment status notification] | POST <<<
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
*/
