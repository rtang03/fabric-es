import {
  Commit,
  getPrivatedataMockRepository,
  PrivatedataRepository
} from '@espresso/fabric-cqrs';
import { LoanDetails, LoanDetailsEvents, loanDetailsReducer } from '../../privatedata';

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

export const localRepo: PrivatedataRepository = getPrivatedataMockRepository<LoanDetails, LoanDetailsEvents>(
  db,
  'privatedata',
  loanDetailsReducer
);
