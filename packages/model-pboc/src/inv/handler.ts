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
  TransferInvoice: async ({ payload }) => { // TODO NOTE transform incoming data from endpoint to payload
    const events: InvoiceEvents[] = [
      { type: 'InvoiceTransferred', payload }
    ];

    return invoiceRepo
      .create({ enrollmentId, id: payload.invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
  UploadInvoiceImage: async ({ payload }) => { // TODO NOTE transform incoming data from endpoint to payload
    const events: InvoiceEvents[] = [
      { type: 'InvoiceImageUploaded', payload }
    ];

    return invoiceRepo
      .create({ enrollmentId, id: payload.invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
  ConfirmInvoice: async ({ payload }) => {
    const events: InvoiceEvents[] = [
      { type: 'InvoiceConfirmed', payload }
    ];

    return invoiceRepo
      .create({ enrollmentId, id: payload.invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
  UpdatePaymentStatus: async ({ payload }) => {
    const events: InvoiceEvents[] = [
      { type: 'PaymentStatusUpdated', payload }
    ];

    return invoiceRepo
      .create({ enrollmentId, id: payload.invoiceId })
      .save({ events })
      .then(({ data }) => data);
  },
});