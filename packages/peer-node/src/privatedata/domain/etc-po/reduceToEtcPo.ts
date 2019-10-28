import { EtcPo, EtcPoEvent } from '../../types/etc-po';

export const reduceToEtcPo: (
  history: EtcPoEvent[],
  initialState?: EtcPo
) => EtcPo = (history, initialState) =>
  history.reduce((etcPo: EtcPo, event: EtcPoEvent): EtcPo => {
    switch (event.type) {
      case 'EtcPoCreated':
        return {
          ...{
            body: null,
            document: null
          },
          id: event.payload.id,
          ownerId: event.payload.ownerId,
          document: { documentId: event.payload.id }
        };

      case 'EtcPoBodyUpdated':
        return {
          ...etcPo,
          id: event.payload.id,
          body: event.payload.body
        };
      default:
        return etcPo;
    }
  }, initialState);
