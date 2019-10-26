import { EtcPoEvent } from '../../types/etc-po';

export function updateBody({
  userId, // userId is neceesary if we need privilege check
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
      type: 'EtcPoBodyUpdated',
      payload: {
        id,
        body,
        timestamp
      }
    }
  ];
}
