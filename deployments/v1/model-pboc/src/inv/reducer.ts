import { buildTag, Status } from '..';
import { Invoice, InvoiceEvents } from '.';

export const invoiceReducer = (invoice: Invoice, event: InvoiceEvents): Invoice => {
  switch (event.type) {
    case 'InvoiceCreated':
      const {
        userId: uid0,
        // buyerName: buy0,
        // sellerName: sell0,
        // buyerBankName: bbnk0,
        incotermsCode: inco0,
        shipVia: svia0,
        // countryOfOrigin: orgn0,
        // goodsDescription: desc0,
        currency: curr0,
        settlementCurrency: scur0,
        ...rest0
      } = event.payload;
      return {
        id: rest0.invoiceId,
        ownerId: uid0,
        status: Status.New,
        // buyerName: buy0,
        // sellerName: sell0,
        // buyerBankName: bbnk0,
        incotermsCode: inco0,
        shipVia: svia0,
        // countryOfOrigin: orgn0,
        // goodsDescription: desc0,
        currency: curr0,
        settlementCurrency: scur0,
        tag: buildTag('entity:Invoice', {
          incotermsCode: inco0, shipVia: svia0, currency: curr0, settlementCurrency: scur0
        }),
        // desc: buildTag(' ', undefined, desc0),
        ...rest0
      };

    case 'InvoiceUpdated':
      const {
        userId: uid1,
        invoiceId: vid1,
        // buyerName: buy1,
        // sellerName: sell1,
        // buyerBankName: bbnk1,
        incotermsCode: inco1,
        shipVia: svia1,
        // countryOfOrigin: orgn1,
        // goodsDescription: desc1,
        currency: curr1,
        settlementCurrency: scur1,
        // attachmentList: att1,
        ...rest1
      } = event.payload;
      // if (att1) invoice.attachmentList.push(...att1);

      if (!invoice) { // TODO: TEMP!!! should move this checking to generic reducer impl, and check with event Lifecycle (https://github.com/rtang03/fabric-es/issues/131)
        throw new Error(`[lifecycle] entity '${vid1}' not found when reducing event '${event.type}'`); // TODO: HERE is an example of not havning info such as commit ids in events, impossible to write more intelligent reducers (https://github.com/rtang03/fabric-es/issues/131)
      }

      return {
        ...invoice,
        // buyerName: buy1,
        // sellerName: sell1,
        // buyerBankName: bbnk1,
        incotermsCode: inco1,
        shipVia: svia1,
        // countryOfOrigin: orgn1,
        // goodsDescription: desc1,
        currency: curr1,
        settlementCurrency: scur1,
        tag: buildTag(invoice.tag, {
          incotermsCode: inco1, shipVia: svia1, currency: curr1, settlementCurrency: scur1
        }),
        // desc: buildTag(' ', invoice.desc, desc1),
        ...rest1,
        status: Status.Updated
      };

    case 'InvoiceTransferred':
      const { userId: uid2, invoiceId: vid2, ...rest2 } = event.payload;
      // if (att2) invoice.attachmentList.push(...att2);

      if (!invoice) { // TODO: TEMP!!! should move this checking to generic reducer impl, and check with event Lifecycle (https://github.com/rtang03/fabric-es/issues/131)
        throw new Error(`[lifecycle] entity '${vid2}' not found when reducing event '${event.type}'`); // TODO: HERE is an example of not havning info such as commit ids in events, impossible to write more intelligent reducers (https://github.com/rtang03/fabric-es/issues/131)
      }

      return {
        ...invoice,
        // financeNo,
        // tag: buildTag(',', invoice.tag, financeNo),
        ...rest2,
        status: Status.Transferred
      };

    case 'InvoiceImageUploaded':
      const { userId: uid3, invoiceId: vid3, ...rest3 } = event.payload;
      // if (att3) invoice.attachmentList.push(...att3);

      if (!invoice) { // TODO: TEMP!!! should move this checking to generic reducer impl, and check with event Lifecycle (https://github.com/rtang03/fabric-es/issues/131)
        throw new Error(`[lifecycle] entity '${vid3}' not found when reducing event '${event.type}'`); // TODO: HERE is an example of not havning info such as commit ids in events, impossible to write more intelligent reducers (https://github.com/rtang03/fabric-es/issues/131)
      }

      return {
        ...invoice,
        ...rest3
      };

    case 'InvoiceConfirmed':
      const { userId: uid4, invoiceId: vid4, actionResponse, ...rest4} = event.payload;

      if (!invoice) { // TODO: TEMP!!! should move this checking to generic reducer impl, and check with event Lifecycle (https://github.com/rtang03/fabric-es/issues/131)
        throw new Error(`[lifecycle] entity '${vid4}' not found when reducing event '${event.type}'`); // TODO: HERE is an example of not havning info such as commit ids in events, impossible to write more intelligent reducers (https://github.com/rtang03/fabric-es/issues/131)
      }

      return {
        ...invoice,
        ...rest4,
        status: (actionResponse === '1') ? Status.Accepted : Status.Rejected,
        // received: (rcv4 === '1') ? true : false
      };

    case 'PaymentStatusUpdated':
      const { userId: uid5, invoiceId: vid5, ...rest5} = event.payload;

      if (!invoice) { // TODO: TEMP!!! should move this checking to generic reducer impl, and check with event Lifecycle (https://github.com/rtang03/fabric-es/issues/131)
        throw new Error(`[lifecycle] entity '${vid5}' not found when reducing event '${event.type}'`); // TODO: HERE is an example of not havning info such as commit ids in events, impossible to write more intelligent reducers (https://github.com/rtang03/fabric-es/issues/131)
      }

      return {
        ...invoice,
        // sellerBankName: sellerBank,
        // remittanceBank,
        // received: rcv5,
        // tag: buildTag(',', invoice.tag, sellerBank, remittanceBank),
        ...rest5
      };
  }
};