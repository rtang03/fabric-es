import { Attachment } from '..';
import { InvPayload } from '.';

export interface InvoiceCommands {
  CreateInvoice: {
    payload: InvPayload;
  };
  UpdateInvoice: {
    payload: InvPayload;
  };
  TransferInvoice: {
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
  UploadInvoiceImage: {
    payload: {
      userId: string;
      timestamp: number;
      invoiceId: string;
      // attachmentList: Attachment[];
    };
  };
  ConfirmInvoice: {
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
  UpdatePaymentStatus: {
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
};
