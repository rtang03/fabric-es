import { EtcPo, EtcPoEvent } from '../../types/etc-po';

export function reduceToEtcPo(
  history: EtcPoEvent[],
  initialState?: EtcPo
): EtcPo {
  const etcPoReducer = (etcPo: EtcPo, { type, payload }): EtcPo => {
    const defaultValues = {
      body: null,
      document: null
    };

    switch (type) {
      case 'EtcPoCreated':
        return {
          ...defaultValues,
          id: payload.id,
          ownerId: payload.ownerId,
          document: { documentId: payload.id }
        };

      case 'EtcPoBodyUpdated':
        return {
          ...etcPo,
          id: payload.id,
          body: payload.body
        };
      default:
        return etcPo;
    }
  };
  return history.reduce(etcPoReducer, initialState);
}
