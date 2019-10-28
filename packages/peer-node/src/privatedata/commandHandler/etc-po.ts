import { PrivatedataRepository } from '@espresso/fabric-cqrs';
import { createEtcPo, updateBody } from '../domain/etc-po';
import { EtcPo, EtcPoCommandHandler, EtcPoEvent } from '../types';

export const etcPoCommandHandler: ({
  etcPoRepo
}: {
  etcPoRepo: PrivatedataRepository<EtcPo, EtcPoEvent>;
}) => EtcPoCommandHandler = ({ etcPoRepo }) => ({
  CreateEtcPo: async ({ userId, payload: { id, body, timestamp } }) =>
    etcPoRepo.create(id).save(createEtcPo({ userId, id, body, timestamp })),
  UpdateBody: async ({ userId, payload: { id, body, timestamp } }) =>
    etcPoRepo
      .getById(id)
      .then(({ save }) => save(updateBody({ userId, id, body, timestamp })))
});
