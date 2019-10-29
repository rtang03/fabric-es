import { Commit } from '@espresso/fabric-cqrs';
import { etcPoCommandHandler } from '../../commandHandler';
import { EtcPo, Resolvers, TArgEtcPo } from '../../types';

export const etcPoResolvers: Resolvers<TArgEtcPo> = {
  Query: {
    aboutEtcPo: () => 'Etc Po Info',
    createEtcPo: async (
      _,
      { userId, id, body },
      {
        dataSources: {
          etcDataSource: { privatedataRepo }
        },
        enrollmentId
      }
    ): Promise<Commit> =>
      etcPoCommandHandler({
        enrollmentId,
        etcPoRepo: privatedataRepo
      }).CreateEtcPo({
        userId,
        payload: { id, body, timestamp: Date.now() }
      }),
    getEtcPoById: async (
      _,
      { id },
      {
        dataSources: {
          etcDataSource: {
            privatedataRepo: { getById }
          }
        },
        enrollmentId
      }
    ): Promise<EtcPo | { error: any }> =>
      getById({ enrollmentId, id })
        .then(({ currentState }) => currentState)
        .catch(error => ({ error }))
  },
  Document: {
    etcPo: (
      { documentId },
      _args,
      {
        dataSources: {
          etcDataSource: {
            privatedataRepo: { getById }
          }
        }
      }
    ) => getById({ id: documentId }).then(({ currentState }) => currentState)
  }
};
