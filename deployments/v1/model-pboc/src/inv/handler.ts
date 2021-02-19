import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { InvoiceEvents, InvoiceCommandHandler, InvoiceRepo } from '.';

export const invoiceCommandHandler: (option: {
  enrollmentId: string;
  invoiceRepo: InvoiceRepo;
}) => InvoiceCommandHandler = ({
  enrollmentId,
  invoiceRepo
}) => ({
  CreateInvoice: async ({ payload }) => {
    const events: InvoiceEvents[] = [
      { type: 'InvoiceCreated', lifeCycle: Lifecycle.BEGIN, payload }
    ];

    return invoiceRepo
      .create({ enrollmentId, id: payload.invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
  UpdateInvoice: async ({ payload }) => {
    const events: InvoiceEvents[] = [
      { type: 'InvoiceUpdated', payload }
    ];

    return invoiceRepo
      .create({ enrollmentId, id: payload.invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
  TransferInvoice: async ({
    payload: { userId, timestamp, invoiceId, poId }
  }) => {
    const events: InvoiceEvents[] = [
      { type: 'InvoiceTransferred', payload: { userId, timestamp, invoiceId, poId }}
    ];

    return invoiceRepo
      .create({ enrollmentId, id: invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
  UploadInvoiceImage: async ({ payload }) => {
    const events: InvoiceEvents[] = [
      { type: 'InvoiceImageUploaded', payload }
    ];

    return invoiceRepo
      .create({ enrollmentId, id: payload.invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
  ConfirmInvoice: async ({
    payload: { userId, timestamp, invoiceId, versionNo, actionResponse }
  }) => {
    const events: InvoiceEvents[] = [
      { type: 'InvoiceConfirmed', payload: { userId, timestamp, invoiceId, versionNo, actionResponse }}
    ];

    return invoiceRepo
      .create({ enrollmentId, id: invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
  UpdatePaymentStatus: async ({
    payload: { userId, timestamp, invoiceId }
  }) => {
    const events: InvoiceEvents[] = [
      { type: 'PaymentStatusUpdated', payload: { userId, timestamp, invoiceId }}
    ];

    return invoiceRepo
      .create({ enrollmentId, id: invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
});