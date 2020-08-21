import { Status } from '..';
import { PO, PoEvents } from '.';

export const poReducer = (po: PO, event: PoEvents): PO => {
  switch (event.type) {
    case 'PoCreated':
      const { userId: uid0, ...rest0 } = event.payload;
      return {
        id: rest0.poId,
        ownerId: uid0,
        status: Status.New,
        ...rest0
      };

    case 'PoUpdated':
      const { userId: uid1, poId: pid1, ...rest1 } = event.payload;
      return {
        ...po,
        ...rest1,
        status: Status.Updated
      };

    case 'PoCancelled':
      const { userId: uid2, poId: pid2, timestamp, reason } = event.payload;
      return {
        ...po,
        timestamp,
        comment: reason,
        status: Status.Cancelled
      };

    case 'PoProcessed':
      const { userId: uid3, poId: pid3, actionResponse, ...rest3 } = event.payload;
      return {
        ...po,
        ...rest3,
        status: (actionResponse === '1') ? Status.Accepted : Status.Rejected
      };
  };
};