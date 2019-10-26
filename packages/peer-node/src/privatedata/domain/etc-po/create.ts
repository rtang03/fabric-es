import { EtcPoEvent } from '../../types/etc-po';

export function createEtcPo({
  userId,
  id,
  body,
  timestamp
}: {
  userId: string;
  id: string;
  body: string;
  timestamp: number;
}): EtcPoEvent[] {
  return [
    {
      type: 'EtcPoCreated',
      payload: {
        id,
        ownerId: userId,
        timestamp
      }
    },
    {
      type: 'EtcPoBodyUpdated',
      payload: {
        id,
        body,
        timestamp
      }
    }
  ];
}
