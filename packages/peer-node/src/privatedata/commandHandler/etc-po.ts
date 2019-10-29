import { PrivatedataRepository } from '@espresso/fabric-cqrs';
import { createEtcPo, updateBody } from '../domain/etc-po';
import { EtcPo, EtcPoCommandHandler, EtcPoEvent } from '../types';

export const etcPoCommandHandler: (option: {
  enrollmentId: string;
  etcPoRepo: PrivatedataRepository<EtcPo, EtcPoEvent>;
}) => EtcPoCommandHandler = ({ enrollmentId, etcPoRepo }) => ({
  CreateEtcPo: async ({ userId, payload: { id, body, timestamp } }) =>
    etcPoRepo
      .create({ enrollmentId, id })
      .save(createEtcPo({ userId, id, body, timestamp })),
  UpdateBody: async ({ userId, payload: { id, body, timestamp } }) =>
    etcPoRepo
      .getById({ enrollmentId, id })
      .then(({ save }) => save(updateBody({ userId, id, body, timestamp })))
});
