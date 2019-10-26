import {
  Commit,
  getPrivatedataMockRepository,
  PrivatedataRepository
} from '@espresso/fabric-cqrs';
import { EtcPo, EtcPoEvent } from '../../privatedata';
import { reduceToEtcPo } from '../../privatedata/domain/etc-po';

const db: Record<string, Commit> = {
  '20181114163145704:example@gmail.com': {
    committedAt: '1542213105704',
    entityName: 'user',
    entityId: 'example@gmail.com',
    id: 'example@gmail.com',
    commitId: '20181114163145704:example@gmail.com',
    version: 0,
    events: [
      {
        payload: {
          name: 'Mr. Example',
          timestamp: 1542213105704,
          userId: 'example@gmail.com'
        },
        type: 'UserCreated'
      }
    ]
  }
};

export const etcPoRepo: PrivatedataRepository = getPrivatedataMockRepository<
  EtcPo,
  EtcPoEvent
>(db, 'privatedata', reduceToEtcPo);
