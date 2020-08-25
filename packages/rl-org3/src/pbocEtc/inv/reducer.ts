import { Status } from '..';
import { Invoice, InvoiceEvents } from '.';

export const invoiceReducer = (invoice: Invoice, event: InvoiceEvents): Invoice => {
  switch (event.type) {
    case 'InvoiceCreated':
      const { userId: uid0, ...rest0 } = event.payload;
      return {
        id: rest0.invoiceId,
        ownerId: uid0,
        status: Status.New,
        ...rest0
      };

    case 'InvoiceUpdated':
      const { userId: uid1, invoiceId: vid1, attachmentList: att1, ...rest1 } = event.payload;
      if (att1) invoice.attachmentList.push(...att1);
      return {
        ...invoice,
        ...rest1,
        status: Status.Updated
      };

    case 'InvoiceTransferred':
      const { userId: uid2, invoiceId: vid2, attachmentList: att2, ...rest2 } = event.payload;
      if (att2) invoice.attachmentList.push(...att2);
      return {
        ...invoice,
        ...rest2,
        status: Status.Transferred
      };

    case 'InvoiceImageUploaded':
      const { userId: uid3, invoiceId: vid3, attachmentList: att3, ...rest3 } = event.payload;
      if (att3) invoice.attachmentList.push(...att3);
      return {
        ...invoice,
        ...rest3
      };

    case 'InvoiceConfirmed':
      const { userId: uid4, invoiceId: vid4, actionResponse, goodsReceived: rcv4, ...rest4} = event.payload;
      return {
        ...invoice,
        ...rest4,
        status: (actionResponse === '1') ? Status.Accepted : Status.Rejected,
        received: (rcv4 === '1') ? true : false
      };

    case 'PaymentStatusUpdated':
      const { userId: uid5, invoiceId: vid5, ...rest5} = event.payload;
      return {
        ...invoice,
        ...rest5
      };
  }
};