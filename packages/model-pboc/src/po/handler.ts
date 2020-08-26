import { Lifecycle } from '@fabric-es/fabric-cqrs';
import { PoEvents, PoCommandHandler, PoRepo } from '.';

export const poCommandHandler: (option: {
  enrollmentId: string;
  poRepo: PoRepo;
}) => PoCommandHandler = ({
  enrollmentId,
  poRepo
}) => ({
  CreatePo: async ({ payload }) => {
    const events: PoEvents[] = [
      { type: 'PoCreated', lifeCycle: Lifecycle.BEGIN, payload }
    ];

    return poRepo
      .create({ enrollmentId, id: payload.poId })
      .save({ events })
      .then(({ data }) => data);
  },
  UpdatePo: async ({ payload }) => {
    const events: PoEvents[] = [
      { type: 'PoUpdated', payload }
    ];

    return poRepo
      .create({ enrollmentId, id: payload.poId })
      .save({ events })
      .then(({ data }) => data);
  },
  CancelPo: async ({
    payload: { userId, timestamp, poId, reason }
  }) => {
    const events: PoEvents[] = [
      { type: 'PoCancelled', payload: { userId, timestamp, poId, reason }}
    ];

    return poRepo
      .create({ enrollmentId, id: poId })
      .save({ events })
      .then(({ data }) => data);
  },
  ProcessPo: async ({
    payload: {
      userId, timestamp, poId, versionNo, actionResponse, sellerId, sellerBankName, sellerBankAccount, comment
    }
  }) => {
    const events: PoEvents[] = [
      {
        type: 'PoProcessed',
        payload: {
          userId, timestamp, poId, versionNo, actionResponse, sellerId, sellerBankName, sellerBankAccount, comment
        }
      }
    ];

    return poRepo
      .create({ enrollmentId, id: poId })
      .save({ events })
      .then(({ data }) => data);
  }
});