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
        tag: buildTag(',', 'Invoice', inco0, svia0, curr0, scur0),
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
        tag: buildTag(',', invoice.tag, inco1, svia1, curr1, scur1),
        // desc: buildTag(' ', invoice.desc, desc1),
        ...rest1,
        status: Status.Updated
      };

    case 'InvoiceTransferred':
      const { userId: uid2, invoiceId: vid2, ...rest2 } = event.payload;
      // if (att2) invoice.attachmentList.push(...att2);
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
      return {
        ...invoice,
        ...rest3
      };

    case 'InvoiceConfirmed':
      const { userId: uid4, invoiceId: vid4, actionResponse, ...rest4} = event.payload;
      return {
        ...invoice,
        ...rest4,
        status: (actionResponse === '1') ? Status.Accepted : Status.Rejected,
        // received: (rcv4 === '1') ? true : false
      };

    case 'PaymentStatusUpdated':
      const { userId: uid5, invoiceId: vid5, ...rest5} = event.payload;
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