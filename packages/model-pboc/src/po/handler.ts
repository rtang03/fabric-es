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
      { type: 'PoUpdated', lifeCycle: Lifecycle.INTERMEDIATE, payload }
    ];

    return poRepo
      .create({ enrollmentId, id: payload.poId })
      .save({ events })
      .then(({ data }) => data);
  },
  CancelPo: async ({
    // payload: { userId, timestamp, poId, reason }
    payload: { userId, timestamp, poId }
  }) => {
    const events: PoEvents[] = [
      // { type: 'PoCancelled', payload: { userId, timestamp, poId, reason }}
      { type: 'PoCancelled', lifeCycle: Lifecycle.INTERMEDIATE, payload: { userId, timestamp, poId }}
    ];

    return poRepo
      .create({ enrollmentId, id: poId })
      .save({ events })
      .then(({ data }) => data);
  },
  ProcessPo: async ({
    payload: {
      // userId, timestamp, poId, versionNo, actionResponse, sellerId, sellerBankName, sellerBankAccount, comment
      userId, timestamp, poId, versionNo, actionResponse
    }
  }) => {
    const events: PoEvents[] = [
      {
        type: 'PoProcessed',
        lifeCycle: Lifecycle.INTERMEDIATE,
        payload: {
          // userId, timestamp, poId, versionNo, actionResponse, sellerId, sellerBankName, sellerBankAccount, comment
          userId, timestamp, poId, versionNo, actionResponse
        }
      }
    ];

    return poRepo
      .create({ enrollmentId, id: poId })
      .save({ events })
      .then(({ data }) => data);
  }
});